import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ItemImportSchema, CustomerImportSchema, ItemImportDTO, CustomerImportDTO } from '../validators/bulk-import.validator';

export interface BulkImportReport {
  success: boolean;
  summary: {
    total_records_processed: number;
    successfully_imported: number;
    failed_records: number;
  };
  errors: Array<{ row: number; identifier: string; reason: string }>;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export const executeBulkImportItems = async (
  tenantId: string,
  userId: string,
  locationId: string,
  rawData: any[]
): Promise<BulkImportReport> => {
  const report: BulkImportReport = {
    success: false,
    summary: { total_records_processed: rawData.length, successfully_imported: 0, failed_records: 0 },
    errors: [],
  };

  const validRecords: { row: number; data: ItemImportDTO }[] = [];

  // 1. Sanitization and Validation
  for (let i = 0; i < rawData.length; i++) {
    const record = rawData[i];
    const row = i + 2; // Asumiendo que la fila 1 son los headers en Excel
    const identifier = record.sku || `Fila-${row}`;

    const validation = ItemImportSchema.safeParse(record);
    if (!validation.success) {
      report.errors.push({
        row,
        identifier: String(identifier),
        reason: validation.error.errors.map((e) => e.message).join(', '),
      });
      report.summary.failed_records++;
    } else {
      validRecords.push({ row, data: validation.data });
    }
  }

  if (validRecords.length === 0) {
    return report;
  }

  // 2. Transaccionalidad "Todo o Nada" y Procesamiento por Chunks de 500
  const CHUNK_SIZE = 500;
  const chunks = chunkArray(validRecords, CHUNK_SIZE);

  try {
    await prisma.$transaction(async (tx) => {
      // Intentar obtener la categoría "Sin Categorizar" como Fallback
      let fallbackCategory = await tx.category.findFirst({
        where: { tenantId, name: 'Sin Categorizar' }
      });

      if (!fallbackCategory) {
        fallbackCategory = await tx.category.create({
          data: { tenantId, name: 'Sin Categorizar' }
        });
      }

      for (const chunk of chunks) {
        for (const { row, data } of chunk) {
          // Fallback lógica para categoría
          let finalCategoryId = data.category_id;
          if (finalCategoryId) {
            const catExists = await tx.category.findUnique({ where: { id: finalCategoryId } });
            if (!catExists || catExists.tenantId !== tenantId) {
              finalCategoryId = fallbackCategory!.id;
            }
          }

          // Fetch el ítem existente para comparar stock
          const existingItem = await tx.item.findUnique({
            where: { sku: data.sku }
          });

          if (existingItem && existingItem.tenantId !== tenantId) {
            throw new Error(`El SKU ${data.sku} ya está registrado en otra empresa. (Fila ${row})`);
          }

          const item = await tx.item.upsert({
            where: { sku: data.sku },
            update: {
              name: data.name,
              description: data.description,
              cost: new Prisma.Decimal(data.cost),
              price: new Prisma.Decimal(data.price),
              reorderPoint: data.reorder_point,
              categoryId: finalCategoryId,
            },
            create: {
              sku: data.sku,
              name: data.name,
              description: data.description,
              cost: new Prisma.Decimal(data.cost),
              price: new Prisma.Decimal(data.price),
              reorderPoint: data.reorder_point,
              categoryId: finalCategoryId,
              tenantId,
            }
          });

          // Lógica de Kardex e Inventario Inmutable
          const incomingStock = data.stock_actual;
          
          const currentInventory = await tx.inventory.findFirst({
            where: { itemId: item.id, locationId }
          });

          const currentStock = currentInventory ? currentInventory.quantity : 0;
          const diff = incomingStock - currentStock;

          if (diff !== 0) {
            // Upsert al inventario
            await tx.inventory.upsert({
              where: {
                locationId_itemId: { locationId, itemId: item.id }
              },
              update: {
                quantity: incomingStock
              },
              create: {
                locationId,
                itemId: item.id,
                quantity: incomingStock
              }
            });

            // Registro inmutable en Kardex
            await tx.kardexMovement.create({
              data: {
                tenantId,
                itemId: item.id,
                locationOrigenId: diff < 0 ? locationId : null,
                locationDestinoId: diff > 0 ? locationId : null,
                tipo: 'AJUSTE_INVENTARIO',
                cantidad: Math.abs(diff),
                referenceId: `BULK_IMPORT_${Date.now()}`,
                notes: `Ajuste masivo por importación Excel (Fila ${row}). Stock reportado: ${incomingStock}`,
                userId,
              }
            });
          }
        }
      }
    }, {
      maxWait: 10000, // 10 segundos para iniciar transacción
      timeout: 300000 // 5 minutos de timeout para 10k registros
    });

    report.success = true;
    report.summary.successfully_imported = validRecords.length;

  } catch (error: any) {
    report.success = false;
    report.summary.successfully_imported = 0;
    report.errors.push({
      row: 0,
      identifier: 'TRANSACTION_ROLLBACK',
      reason: `Fallo catastrófico en la base de datos, toda la importación fue revertida. Detalle: ${error.message}`
    });
    report.summary.failed_records = report.summary.total_records_processed;
  }

  return report;
};

export const executeBulkImportCustomers = async (
  tenantId: string,
  _userId: string,
  rawData: any[]
): Promise<BulkImportReport> => {
  const report: BulkImportReport = {
    success: false,
    summary: { total_records_processed: rawData.length, successfully_imported: 0, failed_records: 0 },
    errors: [],
  };

  const validRecords: { row: number; data: CustomerImportDTO }[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const record = rawData[i];
    const row = i + 2;
    const identifier = record.company_name || `Fila-${row}`;

    const validation = CustomerImportSchema.safeParse(record);
    if (!validation.success) {
      report.errors.push({
        row,
        identifier: String(identifier),
        reason: validation.error.errors.map((e) => e.message).join(', '),
      });
      report.summary.failed_records++;
    } else {
      validRecords.push({ row, data: validation.data });
    }
  }

  if (validRecords.length === 0) return report;

  const CHUNK_SIZE = 500;
  const chunks = chunkArray(validRecords, CHUNK_SIZE);

  try {
    await prisma.$transaction(async (tx) => {
      for (const chunk of chunks) {
        for (const { data } of chunk) {
          
          // UPSERT based on RFC if provided, else company_name (assuming company_name + tenantId isn't unique, but we will try our best)
          const existingCustomer = await tx.customer.findFirst({
            where: {
              tenantId,
              OR: [
                ...(data.rfc ? [{ rfc: data.rfc }] : []),
                { companyName: data.company_name }
              ]
            }
          });

          if (existingCustomer) {
            await tx.customer.update({
              where: { id: existingCustomer.id },
              data: {
                companyName: data.company_name,
                rfc: data.rfc || existingCustomer.rfc,
                email: data.email || existingCustomer.email,
                phone: data.phone || existingCustomer.phone,
                creditLimit: new Prisma.Decimal(data.credit_limit),
                creditDays: data.credit_days
              }
            });
          } else {
            await tx.customer.create({
              data: {
                tenantId,
                companyName: data.company_name,
                rfc: data.rfc,
                email: data.email,
                phone: data.phone,
                creditLimit: new Prisma.Decimal(data.credit_limit),
                currentDebt: new Prisma.Decimal(0),
                creditDays: data.credit_days
              }
            });
          }
        }
      }
    }, {
      maxWait: 10000,
      timeout: 300000
    });

    report.success = true;
    report.summary.successfully_imported = validRecords.length;

  } catch (error: any) {
    report.success = false;
    report.summary.successfully_imported = 0;
    report.errors.push({
      row: 0,
      identifier: 'TRANSACTION_ROLLBACK',
      reason: `Fallo catastrófico en la base de datos, toda la importación fue revertida. Detalle: ${error.message}`
    });
    report.summary.failed_records = report.summary.total_records_processed;
  }

  return report;
};
