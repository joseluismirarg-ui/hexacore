// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/transaction.controller.ts
// Lógica transaccional pura para registro de ventas B2B.
//
// DECRETOS APLICADOS:
// [D1] Precisión Decimal — Prisma.Decimal para todos los valores monetarios.
// [D2] Idempotencia — busca UUID antes de abrir TX; HTTP 200 si ya existe.
// [D3] Desnorm. sincrónica — Item.globalStock actualizado dentro de la TX.
// [D4] Guard anti-race — updateMany con quantity: { gte: cantidad }.
// [D5] currentDebt inicializado en código, no en BD.
// =============================================================================

import { Request, Response, NextFunction } from "express";
import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  RegistrarTransaccionSchema,
  RegistrarTransaccionDTO,
} from "../validators/transaction.validator";
import {
  UnprocessableEntityError,
  NotFoundError,
} from "../lib/errors";
// WebSocket import (mock/placeholder to simulate WS event emission)
import { EventEmitter } from "events";
export const wsEmitter = new EventEmitter();

// =============================================================================
// POST /api/v1/transacciones/registrar
// =============================================================================

export async function registrarTransaccion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // ── Validación del payload ───────────────────────────────────────────────
    const dto: RegistrarTransaccionDTO = RegistrarTransaccionSchema.parse(
      req.body
    );
    const idempotencyKey = req.idempotencyKey;

    // ── [D2] Verificación de idempotencia ────────────────────────────────────
    // Si el cliente proveyó un Idempotency-Key y ya existe una TX con ese UUID,
    // retornamos el registro existente SIN crear una nueva TX (HTTP 200 seguro).
    if (idempotencyKey) {
      const existingTx = await prisma.transaction.findUnique({
        where: { uuid: idempotencyKey },
        include: { items: true },
      });

      if (existingTx) {
        res.status(200).json({
          success: true,
          idempotent: true,
          message: "Transacción recuperada — idempotency-key ya procesada",
          data: existingTx,
        });
        return;
      }
    }

    // ── Pre-validaciones (lecturas rápidas fuera de la TX atómica) ───────────
    // Mantenerlas fuera de la TX reduce el tiempo de bloqueo en PostgreSQL.

    const customer = await prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundError(`Cliente '${dto.customerId}' no encontrado`);
    }

    const vendedor = await prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!vendedor) {
      throw new NotFoundError(`Usuario/Vendedor '${dto.userId}' no encontrado`);
    }

    // ── [D5] Validación de límite de crédito ─────────────────────────────────
    // Solo aplica para CREDITO y CONSIGNACION (VENTA_DIRECTA es pago inmediato).
    if ((dto.tipo === "CREDITO" || dto.tipo === "CONSIGNACION") && !dto.forceSale) {
      const saldoDisponible = customer.creditLimit
        .sub(customer.currentDebt)
        .toDecimalPlaces(2);

      const totalRequerido = new Prisma.Decimal(dto.total);

      if (totalRequerido.greaterThan(saldoDisponible)) {
        throw new UnprocessableEntityError(
          `Límite de crédito insuficiente. ` +
            `Disponible: $${saldoDisponible.toFixed(2)}, ` +
            `Requerido: $${totalRequerido.toFixed(2)}`,
          "CREDITO_INSUFICIENTE"
        );
      }

      // Bloqueo por antigüedad de deuda (> creditDays o 30 días default)
      if (customer.currentDebt.greaterThan(0)) {
        const diasCredito = customer.creditDays > 0 ? customer.creditDays : 30;
        const diasAtras = new Date();
        diasAtras.setDate(diasAtras.getDate() - diasCredito);

        const salesPastLimit = await prisma.transaction.aggregate({
          where: {
            customerId: customer.id,
            tipo: { in: ["CREDITO", "CONSIGNACION"] },
            createdAt: { gte: diasAtras }
          },
          _sum: { total: true }
        });

        const sumSales = salesPastLimit._sum.total || new Prisma.Decimal(0);

        if (customer.currentDebt.greaterThan(sumSales)) {
          const overdueAmount = customer.currentDebt.sub(sumSales);
          throw new UnprocessableEntityError(
            `Bloqueo por morosidad. El cliente tiene un saldo vencido a más de ${diasCredito} días por aprox. $${overdueAmount.toFixed(2)}. Favor de liquidar antes de emitir nuevo crédito.`,
            "CUENTA_BLOQUEADA_MOROSIDAD"
          );
        }
      }
    }

    // ── Resolver ubicación de inventario ─────────────────────────────────────
    // Si el payload incluye locationId, se descuenta de esa ubicación.
    // Si no, se usa el Almacén Central como fuente canónica por defecto.
    let locationId: string;

    if (dto.locationId) {
      const locationExists = await prisma.inventoryLocation.findUnique({
        where: { id: dto.locationId },
      });
      if (!locationExists) {
        throw new NotFoundError(
          `Ubicación de inventario '${dto.locationId}' no encontrada`
        );
      }
      locationId = dto.locationId;
    } else {
      let almacenCentral = await prisma.inventoryLocation.findFirst({
        where: { tipo: "CENTRAL" },
      });
      if (!almacenCentral) {
        almacenCentral = await prisma.inventoryLocation.create({
          data: {
            name: "Almacén Central",
            tipo: "CENTRAL",
          }
        });
      }
      locationId = almacenCentral.id;
    }

    // =========================================================================
    // TRANSACCIÓN ATÓMICA — Nivel de aislamiento SERIALIZABLE
    // Garantiza que ninguna otra TX pueda leer stock desactualizado entre
    // nuestro updateMany y el commit. Timeout 10s para evitar bloqueos largos.
    // =========================================================================
    const result = await prisma.$transaction(
      async (tx) => {
        // ── Paso 1: Crear la transacción maestra ─────────────────────────────
        // Si hay idempotency-key, la usamos como UUID; PostgreSQL no la genera
        // automáticamente en este caso — la proveemos explícitamente.
        const transaction = await tx.transaction.create({
          data: {
            ...(idempotencyKey ? { uuid: idempotencyKey } : {}),
            tipo: dto.tipo as TransactionType,
            status: "COMPLETADO",
            total: new Prisma.Decimal(dto.total),
            userId: dto.userId,
            customerId: dto.customerId,
            items: {
              create: dto.items.map((item) => ({
                itemId: item.itemId,
                cantidad: item.cantidad,
                precioAplicado: new Prisma.Decimal(item.precioAplicado),
              })),
            },
          },
          include: {
            items: {
              include: {
                item: {
                  select: { id: true, sku: true, name: true },
                },
              },
            },
            customer: {
              select: { id: true, companyName: true },
            },
            user: {
              select: { id: true, name: true },
            },
          },
        });

        // ── Paso 2: Descontar stock con guard anti-race ───────────────────────
        // [D4] updateMany con guard `quantity: { gte: cantidad }` garantiza
        // que la query solo actualiza si hay stock suficiente.
        // Si count === 0: otra TX ganó la carrera (o el stock es 0) → rollback.
        for (const item of dto.items) {
          // [D4] Guard anti-race en InventoryStock
          const stockUpdateResult = await tx.inventoryStock.updateMany({
            where: {
              locationId: locationId,
              itemId: item.itemId,
              quantity: { gte: item.cantidad }, // Guard: no permite stock negativo
            },
            data: {
              quantity: { decrement: item.cantidad },
            },
          });

          if (stockUpdateResult.count === 0) {
            // Obtenemos el stock actual para dar un mensaje preciso al caller
            const stockActual = await tx.inventoryStock.findFirst({
              where: {
                locationId: locationId,
                itemId: item.itemId,
              },
              select: { quantity: true },
            });

            const disponible = stockActual?.quantity ?? 0;
            throw new UnprocessableEntityError(
              `Stock insuficiente para el producto '${item.itemId}'. ` +
                `Disponible: ${disponible}, Solicitado: ${item.cantidad}`,
              "STOCK_INSUFICIENTE"
            );
          }

          // [D3] Desnormalización sincrónica: mantener Item.globalStock alineado
          // con la suma de InventoryStock.quantity de forma atómica.
          await tx.item.update({
            where: { id: item.itemId },
            data: {
              globalStock: { decrement: item.cantidad },
            },
          });
        }

        // ── Paso 3: Actualizar deuda del cliente ─────────────────────────────
        // Solo para CREDITO y CONSIGNACION. VENTA_DIRECTA es pago inmediato.
        if (dto.tipo === "CREDITO" || dto.tipo === "CONSIGNACION") {
          await tx.customer.update({
            where: { id: dto.customerId },
            data: {
              currentDebt: {
                increment: new Prisma.Decimal(dto.total),
              },
            },
          });
        }

        // ── Paso 4: Audit Log atómico ─────────────────────────────────────────
        await tx.auditLog.create({
          data: {
            accion: `REGISTRO_TRANSACCION_${dto.tipo}`,
            detalles: {
              transactionId: transaction.id,
              transactionUuid: transaction.uuid,
              tipo: dto.tipo,
              total: dto.total,
              customerId: dto.customerId,
              userId: dto.userId,
              locationId: locationId,
              itemCount: dto.items.length,
              idempotencyKey: idempotencyKey ?? null,
            },
            userId: dto.userId,
          },
        });

        return transaction;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10_000, // 10 segundos máximo para evitar bloqueos largos
      }
    );

    res.status(201).json({
      success: true,
      idempotent: false,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GET /api/v1/transacciones/:id
// =============================================================================

export async function getTransaccion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: {
              select: { id: true, sku: true, name: true, price: true },
            },
          },
        },
        customer: {
          select: { id: true, companyName: true },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundError(`Transacción '${id}' no encontrada`);
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GET /api/v1/transacciones
// Listado paginado con filtros opcionales
// =============================================================================

export async function listarTransacciones(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      customerId,
      userId,
      status,
      tipo,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where: Prisma.TransactionWhereInput = {
      ...(customerId ? { customerId } : {}),
      ...(userId ? { userId } : {}),
      ...(status
        ? { status: status as Prisma.EnumTransactionStatusFilter }
        : {}),
      ...(tipo ? { tipo: tipo as Prisma.EnumTransactionTypeFilter } : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          customer: { select: { id: true, companyName: true } },
          user: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
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
// POST /api/v1/transacciones/solicitar-autorizacion
// =============================================================================

export async function solicitarAutorizacion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto: RegistrarTransaccionDTO = RegistrarTransaccionSchema.parse(req.body);
    
    // Aquí el backend simularía un request HTTP a la API de WhatsApp/Telegram
    // Ej: axios.post('https://api.whatsapp.com/v1/messages', { to: 'GERENTE', template: 'auth_pos' })
    
    // Guardamos un intento temporal o simplemente lo dejamos en memoria
    // Para simplificar, generamos un authRequestToken y lo retornamos.
    const authRequestToken = `AUTH-${Date.now()}`;

    const tenantId = (req as any).user?.tenantId || "default-tenant";
    // Registrar en AuditLog el intento de bypass
    await prisma.auditLog.create({
      data: {
        accion: "SOLICITUD_AUTORIZACION_POS",
        detalles: {
          token: authRequestToken,
          customer: dto.customerId,
          total: dto.total,
          user: dto.userId
        },
        tenantId,
        userId: dto.userId
      }
    });

    res.status(200).json({
      success: true,
      message: "Solicitud enviada al gerente vía WhatsApp.",
      data: { authRequestToken }
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// POST /api/v1/transacciones/webhook-whatsapp
// =============================================================================

export async function webhookWhatsAppAutorizacion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Payload que enviaría WhatsApp al interactuar con el botón
    const { authRequestToken, status, originalPayload, tenantId, userId } = req.body;

    if (status === 'APPROVED') {
      // Como esto es un Webhook, no estamos en el req del cajero original.
      // Se ejecutaría la transacción con forceSale: true, usando el originalPayload
      // Sin embargo, una arquitectura más robusta emitiría el evento WS para que la caja 
      // retome el flujo original ya desbloqueada.
      
      wsEmitter.emit(`auth_response_${authRequestToken}`, { status: 'APPROVED', originalPayload });
      
      await prisma.auditLog.create({
        data: {
          accion: "AUTORIZACION_POS_APROBADA",
          detalles: { token: authRequestToken, payload: originalPayload },
          tenantId: tenantId || "default-tenant",
          userId: userId || "default-user"
        }
      });

      res.status(200).send("OK - Approved");
    } else {
      wsEmitter.emit(`auth_response_${authRequestToken}`, { status: 'REJECTED' });
      res.status(200).send("OK - Rejected");
    }
  } catch (error) {
    next(error);
  }
}
