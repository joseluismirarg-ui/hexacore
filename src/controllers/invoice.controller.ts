// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/invoice.controller.ts
// Mock simulado de timbrado CFDI 4.0.
// En producción, reemplazar el bloque de timbrado con el PAC real.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { TimbrarFacturaSchema } from '../validators/invoice.validator';
import { NotFoundError, UnprocessableEntityError, ConflictError } from '../lib/errors';

// =============================================================================
// POST /api/v1/facturas/timbrar
// Simula el timbrado CFDI 4.0 de una transacción.
// Genera UUID-SAT simulado, URLs de PDF/XML mock, persiste en BD.
// =============================================================================
export async function timbrarFactura(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = TimbrarFacturaSchema.parse(req.body);

    // Pre-validaciones
    const [transaction, customer] = await Promise.all([
      prisma.transaction.findUnique({
        where: { id: dto.transactionId },
        include: {
          items: { include: { item: { select: { id: true, name: true, sku: true } } } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.customer.findUnique({ where: { id: dto.customerId } }),
    ]);

    if (!transaction) throw new NotFoundError(`Transacción '${dto.transactionId}' no encontrada`);
    if (!customer) throw new NotFoundError(`Cliente '${dto.customerId}' no encontrado`);

    if (transaction.customerId !== dto.customerId) {
      throw new UnprocessableEntityError(
        'La transacción no pertenece al cliente especificado',
        'MISMATCH_CLIENTE'
      );
    }

    if (transaction.status === 'CANCELADO') {
      throw new UnprocessableEntityError(
        'No se puede timbrar una transacción cancelada',
        'TRANSACCION_CANCELADA'
      );
    }

    // Verificar si ya existe una factura para esta transacción
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        transactionId: dto.transactionId,
        status: 'TIMBRADA',
      },
    });

    if (existingInvoice) {
      throw new ConflictError(
        `Esta transacción ya cuenta con una factura timbrada (UUID: ${existingInvoice.uuid_sat})`,
        'FACTURA_DUPLICADA'
      );
    }

    // ── Simulación de timbrado CFDI 4.0 ──────────────────────────────────────
    // En producción: reemplazar con llamada al PAC (Finkok, SIFEI, etc.)
    const uuid_sat = randomUUID().toUpperCase();
    const baseUrl = process.env.SAT_MOCK_BASE_URL || 'https://cfdi.hexacore.mx/mock';
    const pdfUrl = `${baseUrl}/pdf/${uuid_sat}.pdf`;
    const xmlUrl = `${baseUrl}/xml/${uuid_sat}.xml`;

    // Simular latencia del PAC (50ms mock)
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Persistir la factura en BD
    const invoice = await prisma.invoice.create({
      data: {
        uuid_sat,
        rfc_receptor: dto.rfc_receptor,
        regimen_fiscal: dto.regimen_fiscal,
        uso_cfdi: dto.uso_cfdi,
        forma_pago: dto.forma_pago,
        metodo_pago: dto.metodo_pago,
        status: 'TIMBRADA',
        pdfUrl,
        xmlUrl,
        transactionId: dto.transactionId,
        customerId: dto.customerId,
        tenantId: transaction.tenantId,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        invoiceId: invoice.id,
        uuid_sat: invoice.uuid_sat,
        status: invoice.status,
        rfc_receptor: invoice.rfc_receptor,
        regimen_fiscal: invoice.regimen_fiscal,
        uso_cfdi: invoice.uso_cfdi,
        pdfUrl: invoice.pdfUrl,
        xmlUrl: invoice.xmlUrl,
        transaccion: {
          id: transaction.id,
          tipo: transaction.tipo,
          total: transaction.total.toString(),
          createdAt: transaction.createdAt,
        },
        cliente: {
          id: customer.id,
          companyName: customer.companyName,
          rfc: customer.rfc,
        },
        timbradoEn: invoice.createdAt,
        // Indicadores de ambiente para el frontend
        esMock: true,
        ambiente: 'PRUEBAS',
      },
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GET /api/v1/facturas
// Listado de facturas con filtros opcionales
// =============================================================================
export async function listarFacturas(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { customerId, status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          customer: { select: { id: true, companyName: true, rfc: true } },
          transaction: { select: { id: true, tipo: true, total: true, createdAt: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: Math.max(parseInt(page, 10) || 1, 1),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// PATCH /api/v1/facturas/:id/cancelar
// Cancela una factura TIMBRADA
// =============================================================================
export async function cancelarFactura(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new NotFoundError(`Factura '${req.params.id}' no encontrada`);

    if (invoice.status === 'CANCELADA') {
      throw new UnprocessableEntityError('La factura ya está cancelada', 'FACTURA_YA_CANCELADA');
    }

    const cancelled = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'CANCELADA' },
    });

    res.json({ success: true, data: cancelled });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// POST /api/v1/facturas/masiva
// Facturación Masiva y Complementos de Pago
// =============================================================================
export async function facturacionMasiva(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate, rfc_receptor, regimen_fiscal, uso_cfdi } = req.body;

    if (!startDate || !endDate || !rfc_receptor || !regimen_fiscal || !uso_cfdi) {
      throw new UnprocessableEntityError('Faltan parámetros requeridos para facturación masiva');
    }

    // Buscar transacciones completadas sin factura
    const unbilledTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        status: 'COMPLETADO',
        invoices: { none: {} }
      },
      include: { customer: true }
    });

    if (unbilledTransactions.length === 0) {
      res.status(200).json({ success: true, message: 'No hay transacciones pendientes de facturar en ese periodo', data: [] });
      return;
    }

    const createdInvoices = [];
    const baseUrl = process.env.SAT_MOCK_BASE_URL || 'https://cfdi.hexacore.mx/mock';

    for (const tx of unbilledTransactions) {
      const uuid_sat = randomUUID().toUpperCase();
      const invoice = await prisma.invoice.create({
        data: {
          uuid_sat,
          rfc_receptor: tx.customer.rfc || rfc_receptor,
          regimen_fiscal,
          uso_cfdi,
          status: 'TIMBRADA',
          pdfUrl: `${baseUrl}/pdf/${uuid_sat}.pdf`,
          xmlUrl: `${baseUrl}/xml/${uuid_sat}.xml`,
          transactionId: tx.id,
          customerId: tx.customerId,
        }
      });
      createdInvoices.push(invoice);
    }

    res.status(201).json({
      success: true,
      message: `Se timbraron ${createdInvoices.length} facturas masivamente.`,
      data: createdInvoices
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// POST /api/v1/facturas/rep
// Simula el timbrado de un Complemento de Pago (REP)
// =============================================================================
export async function stampRep(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || "default-tenant"; // o usar tenantContext.getStore() si está disponible
    const { paymentId } = req.body;

    if (!paymentId) throw new UnprocessableEntityError("paymentId es requerido", "BAD_REQUEST");

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId, tenantId }
    });

    if (!payment) throw new NotFoundError("Pago no encontrado");
    if (!payment.requires_rep) throw new UnprocessableEntityError("Este pago no requiere REP", "REP_NOT_REQUIRED");
    if (payment.rep_uuid) throw new UnprocessableEntityError("El REP ya fue emitido", "ALREADY_STAMPED");

    // SIMULADOR DE PAC (REP):
    const fakeRepUuid = randomUUID().toUpperCase();

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { rep_uuid: fakeRepUuid }
    });

    res.status(200).json({ success: true, data: updatedPayment, message: "Complemento de Pago (REP) timbrado exitosamente (Mock)" });
  } catch (error) {
    next(error);
  }
}
