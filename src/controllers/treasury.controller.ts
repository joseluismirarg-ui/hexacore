import { Request, Response, NextFunction } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { StringMath } from '../utils/string-math.utils';
const prisma = new PrismaClient();

export class TreasuryController {
  static async createMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bankAccountId, type, amount, concept } = req.body;
      const amountString = amount.toString().trim();

      const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
      if (!account) { res.status(404).json({ error: 'Cuenta no encontrada' }); return; }

      const isCredit = ['DEPOSITO', 'INTERES'].includes(type);
      const isDebit = ['RETIRO', 'TRANSFERENCIA', 'COMISION'].includes(type);
      let newBalance: string;

      if (isCredit) {
        newBalance = StringMath.add(account.currentBalance, amountString);
      } else if (isDebit) {
        if (StringMath.compare(account.currentBalance, amountString) < 0) {
          res.status(400).json({ error: 'Saldo insuficiente' }); return;
        }
        newBalance = StringMath.subtract(account.currentBalance, amountString);
      } else {
        res.status(400).json({ error: 'Tipo inválido' }); return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const movement = await tx.bankMovement.create({ data: { bankAccountId, type, amount: amountString, concept } });
        await tx.bankAccount.update({ where: { id: bankAccountId }, data: { currentBalance: newBalance } });
        return movement;
      });
      res.status(201).json(result);
    } catch (error) { next(error); }
  }

  static async getReconciliation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bankAccountId } = req.query;
      
      const movements = await prisma.bankMovement.findMany({
        where: bankAccountId ? { bankAccountId: String(bankAccountId) } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      const payments = await prisma.payment.findMany({
        orderBy: { date: 'desc' },
        take: 100,
        include: { customer: { select: { companyName: true } } }
      });

      // Basic logic to match exact amounts within similar dates
      const reconciled = [];
      const unmatchedMovements = [];
      const unmatchedPayments = [...payments];

      for (const mov of movements) {
        if (mov.type !== 'DEPOSITO' && mov.type !== 'TRANSFERENCIA') {
            unmatchedMovements.push(mov);
            continue;
        }
        
        const amountMov = Number(mov.amount);
        const matchIndex = unmatchedPayments.findIndex(p => Number(p.amount) === amountMov);
        
        if (matchIndex !== -1) {
            reconciled.push({ movement: mov, payment: unmatchedPayments[matchIndex] });
            unmatchedPayments.splice(matchIndex, 1);
        } else {
            unmatchedMovements.push(mov);
        }
      }

      res.status(200).json({
        success: true,
        data: {
          reconciled,
          unmatchedMovements,
          unmatchedPayments
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // =============================================================================
  // CXP: Pagar a Proveedor
  // =============================================================================
  static async paySupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bankAccountId, supplierId, purchaseOrderId, amount, method, notes } = req.body;
      const amountString = amount.toString().trim();

      const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
      if (!account) { res.status(404).json({ error: 'Cuenta bancaria no encontrada' }); return; }

      // Validate balance
      if (StringMath.compare(account.currentBalance, amountString) < 0) {
        res.status(400).json({ error: 'Saldo insuficiente para pagar al proveedor' }); return;
      }
      const newBalance = StringMath.subtract(account.currentBalance, amountString);

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Supplier Payment
        const payment = await tx.supplierPayment.create({
          data: {
            supplierId,
            purchaseOrderId: purchaseOrderId || null,
            amount: new Prisma.Decimal(amountString),
            method,
            notes
          }
        });

        // 2. Register Bank Movement
        await tx.bankMovement.create({
          data: {
            bankAccountId,
            type: 'TRANSFERENCIA', // Or RETIRO
            amount: amountString,
            concept: `Pago a Proveedor ${supplierId} - OC: ${purchaseOrderId || 'N/A'}`
          }
        });

        // 3. Update Bank Balance
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: { currentBalance: newBalance }
        });

        return payment;
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
