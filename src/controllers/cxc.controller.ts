// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/cxc.controller.ts
// Cuentas por Cobrar (CxC) y Registro de Pagos
// =============================================================================

import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { NotFoundError, UnprocessableEntityError } from "../lib/errors";
import { Prisma } from "@prisma/client";

export class CxcController {
  
  // ---------------------------------------------------------------------------
  // GET /api/v1/cxc/aging
  // Retorna clientes con saldos pendientes, límite de crédito y días de atraso
  // ---------------------------------------------------------------------------
  static async getAgingReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || "default-tenant";
      
      const customers = await prisma.customer.findMany({
        where: { tenantId, currentDebt: { gt: 0 } },
        include: {
          transactions: {
            where: { status: 'PENDIENTE', tipo: { in: ['CREDITO', 'CONSIGNACION'] } },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      // Calcular morosidad
      const result = customers.map(c => {
        const diasCredito = c.creditDays > 0 ? c.creditDays : 30;
        const diasAtrasLimite = new Date();
        diasAtrasLimite.setDate(diasAtrasLimite.getDate() - diasCredito);
        
        let overdueAmount = new Prisma.Decimal(0);
        let maxDaysOverdue = 0;

        c.transactions.forEach(tx => {
          if (tx.createdAt < diasAtrasLimite) {
            overdueAmount = overdueAmount.add(tx.total);
            const diffTime = Math.abs(new Date().getTime() - tx.createdAt.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > maxDaysOverdue) maxDaysOverdue = diffDays;
          }
        });

        if (overdueAmount.greaterThan(c.currentDebt)) {
          overdueAmount = c.currentDebt;
        }

        return {
          id: c.id,
          companyName: c.companyName,
          rfc: c.rfc,
          creditLimit: c.creditLimit,
          currentDebt: c.currentDebt,
          creditDays: diasCredito,
          overdueAmount,
          maxDaysOverdue,
          isBlocked: overdueAmount.greaterThan(0) || c.currentDebt.greaterThanOrEqualTo(c.creditLimit),
          transactions: c.transactions
        };
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // POST /api/v1/cxc/payments
  // Registra un pago, deduce deuda, actualiza estado de transacción.
  // ---------------------------------------------------------------------------
  static async registerPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || "default-tenant";
      const { customerId, transactionId, amount, method, notes } = req.body;

      if (!customerId || !amount || !method) {
        throw new UnprocessableEntityError("Faltan campos requeridos (customerId, amount, method)", "BAD_REQUEST");
      }

      const pagoMonto = new Prisma.Decimal(amount);
      if (pagoMonto.lte(0)) {
        throw new UnprocessableEntityError("El monto debe ser mayor a 0", "INVALID_AMOUNT");
      }

      const payment = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.findUnique({ where: { id: customerId, tenantId } });
        if (!customer) throw new NotFoundError("Cliente no encontrado");

        let targetTx = null;
        let requires_rep = false;
        
        if (transactionId) {
          targetTx = await tx.transaction.findUnique({ where: { id: transactionId, tenantId } });
          if (!targetTx) throw new NotFoundError("Transacción no encontrada");
          
          if (targetTx.status === 'COMPLETADO') {
            throw new UnprocessableEntityError("La transacción ya está pagada (COMPLETADO)", "ALREADY_PAID");
          }

          const invoice = await tx.invoice.findFirst({ where: { transactionId: targetTx.id, tenantId } });
          if (invoice && invoice.metodo_pago === 'PPD') {
            requires_rep = true;
          }
        }

        const newPayment = await tx.payment.create({
          data: {
            amount: pagoMonto,
            method,
            notes,
            requires_rep,
            customerId,
            transactionId: targetTx ? targetTx.id : null,
            tenantId
          }
        });

        const newDebt = customer.currentDebt.sub(pagoMonto);
        await tx.customer.update({
          where: { id: customer.id },
          data: { currentDebt: newDebt.lessThan(0) ? 0 : newDebt }
        });

        if (targetTx) {
          const pastPayments = await tx.payment.aggregate({
            where: { transactionId: targetTx.id },
            _sum: { amount: true }
          });
          const totalPagado = pastPayments._sum.amount || new Prisma.Decimal(0);
          
          if (totalPagado.greaterThanOrEqualTo(targetTx.total)) {
            await tx.transaction.update({
              where: { id: targetTx.id },
              data: { status: 'COMPLETADO' }
            });
          }
        }

        return newPayment;
      });

      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

}
