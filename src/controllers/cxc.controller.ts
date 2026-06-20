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
  // Registra un pago y distribuye el abono en múltiples facturas (PaymentAllocation).
  // ---------------------------------------------------------------------------
  static async registerPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || "default-tenant";
      const { customerId, amount, method, notes, allocations } = req.body;

      if (!customerId || !amount || !method) {
        throw new UnprocessableEntityError("Faltan campos requeridos (customerId, amount, method)", "BAD_REQUEST");
      }

      const pagoMonto = new Prisma.Decimal(amount);
      if (pagoMonto.lte(0)) {
        throw new UnprocessableEntityError("El monto debe ser mayor a 0", "INVALID_AMOUNT");
      }

      // Validar que la suma de allocations no exceda el monto pagado
      if (allocations && Array.isArray(allocations)) {
        const sumaAsignada = allocations.reduce((sum: number, alloc: any) => sum + Number(alloc.amount), 0);
        if (new Prisma.Decimal(sumaAsignada).greaterThan(pagoMonto)) {
          throw new UnprocessableEntityError("La suma de las asignaciones excede el pago total", "OVER_ALLOCATION");
        }
      }

      const payment = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.findUnique({ where: { id: customerId, tenantId } });
        if (!customer) throw new NotFoundError("Cliente no encontrado");

        // Crear el pago cabecera
        const newPayment = await tx.payment.create({
          data: {
            amount: pagoMonto,
            method,
            notes,
            customerId,
            tenantId
          }
        });

        // Aplicar Allocations si existen
        let requires_rep_global = false;
        
        if (allocations && Array.isArray(allocations)) {
          for (const alloc of allocations) {
            const allocMonto = new Prisma.Decimal(alloc.amount);
            
            // Crear Allocation
            await tx.paymentAllocation.create({
              data: {
                amount: allocMonto,
                paymentId: newPayment.id,
                invoiceId: alloc.invoiceId,
                tenantId
              }
            });

            // Leer Invoice
            const invoice = await tx.invoice.findUnique({
              where: { id: alloc.invoiceId, tenantId },
              include: { transaction: true }
            });

            if (invoice) {
              if (invoice.metodo_pago === 'PPD') requires_rep_global = true;

              // Calcular total pagado a esa transacción/factura
              const sumAlloc = await tx.paymentAllocation.aggregate({
                where: { invoiceId: invoice.id, tenantId },
                _sum: { amount: true }
              });

              const totalAsignado = sumAlloc._sum.amount || new Prisma.Decimal(0);
              
              if (totalAsignado.greaterThanOrEqualTo(invoice.transaction.total)) {
                await tx.transaction.update({
                  where: { id: invoice.transaction.id },
                  data: { status: 'COMPLETADO' }
                });
              }
            }
          }
        }

        if (requires_rep_global) {
          await tx.payment.update({
            where: { id: newPayment.id },
            data: { requires_rep: true }
          });
          // El EventBus para REP se dispararía aquí asíncronamente
        }

        const newDebt = customer.currentDebt.sub(pagoMonto);
        await tx.customer.update({
          where: { id: customer.id },
          data: { currentDebt: newDebt.lessThan(0) ? 0 : newDebt }
        });

        return newPayment;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

}
