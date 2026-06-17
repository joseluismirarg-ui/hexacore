// =============================================================================
// HEXA CORE SYSTEMS — src/routes/treasury.routes.ts
// Rutas de Tesorería: Cuentas Bancarias y Movimientos Financieros
// =============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { TreasuryController } from '../controllers/treasury.controller';

const router = Router();

// GET /api/treasury/accounts — Listar todas las cuentas bancarias con sus movimientos
router.get('/accounts', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accounts = await prisma.bankAccount.findMany({
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
      orderBy: { bankName: 'asc' },
    });
    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
});

// GET /api/treasury/accounts/:id — Detalle de una cuenta con todos sus movimientos
router.get('/accounts/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const account = await prisma.bankAccount.findUnique({
      where: { id: req.params.id },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!account) {
      res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
      return;
    }
    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

// POST /api/treasury/movements — Registrar un movimiento bancario (usa StringMath)
router.post('/movements', TreasuryController.createMovement);

// GET /api/treasury/reconciliation — Conciliación Bancaria Automática
router.get('/reconciliation', TreasuryController.getReconciliation);

// POST /api/treasury/cxp/pay — Cuentas por Pagar a Proveedor
router.post('/cxp/pay', TreasuryController.paySupplier);

export default router;
