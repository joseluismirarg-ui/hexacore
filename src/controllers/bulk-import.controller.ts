import { Request, Response, NextFunction } from 'express';
import { executeBulkImportItems, executeBulkImportCustomers } from '../services/bulk-import.service';
import { tenantContext } from '../middleware/tenant.middleware';
import { prisma } from '../lib/prisma';

export const importItemsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = tenantContext.getStore() as string;
    const userId = (req as any).user?.id;
    let locationId = req.body.locationId;
    const payload = req.body.data;

    if (!Array.isArray(payload) || payload.length === 0) {
      res.status(400).json({ success: false, message: 'El payload de datos está vacío o es inválido.' });
      return;
    }

    if (!locationId) {
      const defaultLocation = await prisma.location.findFirst({
        where: { tenantId }
      });
      if (!defaultLocation) {
        res.status(400).json({ success: false, message: 'La empresa no tiene ninguna ubicación registrada.' });
        return;
      }
      locationId = defaultLocation.id;
    }

    const jobId = `IMPORT-ITEMS-${Date.now()}`;

    // Ejecutar el motor de manera asíncrona ("importWorker")
    setTimeout(async () => {
      try {
        const report = await executeBulkImportItems(tenantId, userId, locationId, payload);
        await prisma.auditLog.create({
          data: {
            accion: "BULK_IMPORT_ITEMS_COMPLETED",
            detalles: { jobId, report },
            tenantId,
            userId
          }
        });
      } catch (e: any) {
        await prisma.auditLog.create({
          data: {
            accion: "BULK_IMPORT_ITEMS_FAILED",
            detalles: { jobId, error: e.message },
            tenantId,
            userId
          }
        });
      }
    }, 0);
    
    res.status(202).json({ success: true, message: 'Importación iniciada en segundo plano.', data: { jobId } });
  } catch (error) {
    next(error);
  }
};

export const importCustomersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = tenantContext.getStore() as string;
    const userId = (req as any).user?.id;
    const payload = req.body.data;

    if (!Array.isArray(payload) || payload.length === 0) {
      res.status(400).json({ success: false, message: 'El payload de datos está vacío o es inválido.' });
      return;
    }

    const jobId = `IMPORT-CUSTOMERS-${Date.now()}`;

    // Worker Asíncrono
    setTimeout(async () => {
      try {
        const report = await executeBulkImportCustomers(tenantId, userId, payload);
        await prisma.auditLog.create({
          data: {
            accion: "BULK_IMPORT_CUSTOMERS_COMPLETED",
            detalles: { jobId, report },
            tenantId,
            userId
          }
        });
      } catch (e: any) {
        await prisma.auditLog.create({
          data: {
            accion: "BULK_IMPORT_CUSTOMERS_FAILED",
            detalles: { jobId, error: e.message },
            tenantId,
            userId
          }
        });
      }
    }, 0);
    
    res.status(202).json({ success: true, message: 'Importación iniciada en segundo plano.', data: { jobId } });
  } catch (error) {
    next(error);
  }
};
