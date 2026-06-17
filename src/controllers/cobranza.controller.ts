// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/cobranza.controller.ts
// Gestión de estados de cuenta y registro de abonos a deuda de clientes B2B.
// =============================================================================

import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  AbonarDeudaSchema,
  AbonarDeudaDTO,
} from "../validators/cobranza.validator";
import {
  NotFoundError,
  BadRequestError,
  UnprocessableEntityError,
} from "../lib/errors";

// =============================================================================
// GET /api/v1/cobranza/:customerId
// Estado de cuenta completo del cliente: deuda actual, límite, saldo disponible
// y las últimas 50 transacciones de crédito/consignación.
// =============================================================================

export async function getEstadoCuenta(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { customerId } = req.params;

    if (!customerId || customerId.trim() === "") {
      throw new BadRequestError("customerId es requerido en la URL");
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        transactions: {
          // Ordenamos por fecha descendente para mostrar movimientos recientes
          orderBy: { createdAt: "desc" },
          take: 50,
          where: {
            // Solo transacciones que generan deuda; VENTA_DIRECTA no afecta saldo
            tipo: { in: ["CREDITO", "CONSIGNACION"] },
          },
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { items: true } },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError(`Cliente '${customerId}' no encontrado`);
    }

    // Calculamos el saldo disponible de forma tipesegura con Decimal
    const saldoDisponible = customer.creditLimit
      .sub(customer.currentDebt)
      .toDecimalPlaces(2);

    const porcentajeUtilizado = customer.creditLimit.isZero()
      ? new Prisma.Decimal(0)
      : customer.currentDebt
          .div(customer.creditLimit)
          .mul(100)
          .toDecimalPlaces(2);

    res.status(200).json({
      success: true,
      data: {
        customerId: customer.id,
        companyName: customer.companyName,
        creditLimit: customer.creditLimit,
        currentDebt: customer.currentDebt,
        saldoDisponible,
        porcentajeUtilizado,
        recentTransactions: customer.transactions,
        transactionCount: customer.transactions.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// POST /api/v1/cobranza/abonar
// Registra un abono que disminuye la deuda acumulada del cliente.
// El monto abonado no puede exceder la deuda actual (no se admiten saldos
// a favor en esta versión — solo reducción de pasivo).
// =============================================================================

export async function abonarDeuda(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto: AbonarDeudaDTO = AbonarDeudaSchema.parse(req.body);

    // ── Pre-lectura fuera de TX para mensaje de error preciso ────────────────
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
      throw new NotFoundError(`Usuario '${dto.userId}' no encontrado`);
    }

    // ── Validación de negocio: el abono no puede superar la deuda actual ─────
    const montoDecimal = new Prisma.Decimal(dto.monto);

    if (montoDecimal.greaterThan(customer.currentDebt)) {
      throw new UnprocessableEntityError(
        `El monto a abonar ($${montoDecimal.toFixed(2)}) excede la deuda actual ` +
          `del cliente ($${customer.currentDebt.toFixed(2)}). ` +
          `No se admiten saldos a favor.`,
        "ABONO_EXCEDE_DEUDA"
      );
    }

    if (customer.currentDebt.isZero()) {
      throw new UnprocessableEntityError(
        "El cliente no tiene deuda pendiente. No hay nada que abonar.",
        "DEUDA_CERO"
      );
    }

    // =========================================================================
    // TRANSACCIÓN ATÓMICA — SERIALIZABLE
    // =========================================================================
    const result = await prisma.$transaction(
      async (tx) => {
        // ── Decrementar currentDebt ───────────────────────────────────────────
        const updatedCustomer = await tx.customer.update({
          where: { id: dto.customerId },
          data: {
            currentDebt: {
              decrement: montoDecimal,
            },
          },
        });

        // ── Audit log del abono ───────────────────────────────────────────────
        await tx.auditLog.create({
          data: {
            accion: "ABONO_DEUDA",
            detalles: {
              customerId: dto.customerId,
              companyName: customer.companyName,
              montoAbonado: dto.monto,
              notas: dto.notas ?? null,
              deudaAnterior: customer.currentDebt.toFixed(2),
              deudaNueva: updatedCustomer.currentDebt.toFixed(2),
              cobradoPor: vendedor.name,
            },
            userId: dto.userId,
          },
        });

        return updatedCustomer;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 8_000,
      }
    );

    // Calcular saldo disponible post-abono
    const saldoDisponible = result.creditLimit
      .sub(result.currentDebt)
      .toDecimalPlaces(2);

    res.status(200).json({
      success: true,
      data: {
        customerId: result.id,
        companyName: result.companyName,
        montoAbonado: dto.monto,
        deudaAnterior: customer.currentDebt,
        deudaNueva: result.currentDebt,
        saldoDisponible,
        cobradoPor: vendedor.name,
      },
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GET /api/v1/cobranza
// Listado de todos los clientes con deuda activa (currentDebt > 0), ordenados
// por deuda descendente para priorizar cobros.
// =============================================================================

export async function getClientesConDeuda(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = "1", limit = "20" } = req.query as Record<string, string>;

    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [clientes, total] = await Promise.all([
      prisma.customer.findMany({
        where: {
          currentDebt: { gt: 0 },
        },
        orderBy: { currentDebt: "desc" },
        skip,
        take,
        select: {
          id: true,
          companyName: true,
          creditLimit: true,
          currentDebt: true,
        },
      }),
      prisma.customer.count({
        where: { currentDebt: { gt: 0 } },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: clientes,
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
