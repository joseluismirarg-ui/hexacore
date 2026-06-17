import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { AbonarDeudaSchema, AbonarDeudaDTO } from "./cobranza.validator";
import { NotFoundError, BadRequestError } from "../errors";

// =============================================================================
// GET /api/v1/cobranza/:customerId
// =============================================================================

export async function getEstadoCuenta(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { customerId } = req.params;
    if (!customerId) throw new BadRequestError("customerId requerido");

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50, // Últimos 50 movimientos
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!customer) throw new NotFoundError("Cliente no encontrado");

    res.status(200).json({
      success: true,
      data: {
        customerId: customer.id,
        companyName: customer.companyName,
        creditLimit: customer.creditLimit,
        currentDebt: customer.currentDebt,
        recentTransactions: customer.transactions,
      },
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// POST /api/v1/cobranza/abonar
// =============================================================================

export async function abonarDeuda(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto: AbonarDeudaDTO = AbonarDeudaSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) throw new NotFoundError("Cliente no encontrado");

    // =========================================================================
    // TRANSACCIÓN ATÓMICA
    // =========================================================================
    const result = await prisma.$transaction(
      async (tx) => {
        // Disminuir la deuda actual (se asume que si abona más del currentDebt, 
        // quedaría en negativo como saldo a favor, o podríamos restringirlo)
        const updatedCustomer = await tx.customer.update({
          where: { id: dto.customerId },
          data: {
            currentDebt: { decrement: new Prisma.Decimal(dto.monto) },
          },
        });

        // Crear AuditLog
        await tx.auditLog.create({
          data: {
            accion: "ABONO_DEUDA",
            detalles: {
              customerId: dto.customerId,
              montoAbonado: dto.monto,
              notas: dto.notas,
              deudaAnterior: customer.currentDebt,
              deudaNueva: updatedCustomer.currentDebt,
            },
            userId: dto.userId,
          },
        });

        return updatedCustomer;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        customerId: result.id,
        currentDebt: result.currentDebt,
        montoAbonado: dto.monto,
      },
    });
  } catch (err) {
    next(err);
  }
}
