import { Request, Response, NextFunction } from "express";
import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../prisma";
import {
  RegistrarTransaccionSchema,
  RegistrarTransaccionDTO,
} from "./transaction.validator";
import {
  UnprocessableEntityError,
  NotFoundError,
  InternalError,
} from "../errors";

// =============================================================================
// POST /api/v1/transacciones/registrar
// =============================================================================

export async function registrarTransaccion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto: RegistrarTransaccionDTO = RegistrarTransaccionSchema.parse(
      req.body
    );
    const idempotencyKey = req.idempotencyKey;

    // ── Idempotency Check ──────────────────────────────────────────────────
    if (idempotencyKey) {
      const existingTx = await prisma.transaction.findUnique({
        where: { uuid: idempotencyKey },
      });
      if (existingTx) {
        res.status(200).json({
          success: true,
          message: "Transacción recuperada por idempotencia",
          data: existingTx,
        });
        return;
      }
    }

    // ── Pre-validaciones fuera de la TX (lecturas rápidas) ──────────────────
    const customer = await prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundError("Cliente no encontrado");

    const vendedor = await prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!vendedor) throw new NotFoundError("Vendedor no encontrado");

    // ── Validar límite de crédito para CREDITO / CONSIGNACION ──────────────
    if (dto.tipo === "CREDITO" || dto.tipo === "CONSIGNACION") {
      const saldoDisponible =
        customer.creditLimit.toNumber() - customer.currentDebt.toNumber();

      if (dto.total > saldoDisponible) {
        throw new UnprocessableEntityError(
          `Límite de crédito insuficiente. Disponible: ${saldoDisponible.toFixed(
            2
          )}, Requerido: ${dto.total.toFixed(2)}`,
          "CREDITO_INSUFICIENTE"
        );
      }
    }

    // ── Obtener Almacén Central ──────────────────────────────────────────────
    const almacenCentral = await prisma.inventoryLocation.findFirst({
      where: { tipo: "CENTRAL" },
    });
    if (!almacenCentral)
      throw new InternalError("Almacén Central no configurado");

    // =========================================================================
    // TRANSACCIÓN ATÓMICA
    // =========================================================================
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Crear la transacción maestra
        const transaction = await tx.transaction.create({
          data: {
            uuid: idempotencyKey || undefined, // Usa Idempotency-Key si existe, sino PostgreSQL genera UUID
            tipo: dto.tipo as TransactionType,
            status: "COMPLETADO", // Asumimos completado directamente
            total: new Prisma.Decimal(dto.total),
            userId: dto.userId,
            customerId: dto.customerId,
            items: {
              create: dto.items.map((l) => ({
                productId: l.productId,
                cantidad: l.cantidad,
                precioAplicado: new Prisma.Decimal(l.precioAplicado),
              })),
            },
          },
          include: {
            items: true,
          },
        });

        // 2. Mover stock y desnormalizar de forma sincrónica
        for (const item of dto.items) {
          // Guard anti-race condition en la tabla intermedia (InventoryStock)
          const updatedStock = await tx.inventoryStock.updateMany({
            where: {
              locationId: almacenCentral.id,
              productId: item.productId,
              quantity: { gte: item.cantidad },
            },
            data: { quantity: { decrement: item.cantidad } },
          });

          if (updatedStock.count === 0) {
            throw new UnprocessableEntityError(
              `Stock insuficiente o condición de carrera detectada en producto ${item.productId}`,
              "RACE_CONDITION_STOCK"
            );
          }

          // Desnormalización sincrónica: globalStock en Product
          await tx.product.update({
            where: { id: item.productId },
            data: { globalStock: { decrement: item.cantidad } },
          });
        }

        // 3. Lógica de Deuda
        if (dto.tipo === "CREDITO" || dto.tipo === "CONSIGNACION") {
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { currentDebt: { increment: new Prisma.Decimal(dto.total) } },
          });
        }

        // 4. Audit log
        await tx.auditLog.create({
          data: {
            accion: `REGISTRO_TRANSACCION_${dto.tipo}`,
            detalles: {
              transactionId: transaction.id,
              tipo: dto.tipo,
              total: dto.total,
              customerId: dto.customerId,
            },
            userId: dto.userId,
          },
        });

        return transaction;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      }
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
