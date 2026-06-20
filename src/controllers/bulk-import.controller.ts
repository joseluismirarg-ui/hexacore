import { Request, Response, NextFunction } from 'express';
import { executeBulkImportItems, executeBulkImportCustomers } from '../services/bulk-import.service';
import { tenantContext } from '../middleware/tenant.middleware';
import { prisma } from '../lib/prisma';

export const importItemsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = tenantContext.getStore() as string;
    const userId = (req as any).user?.id;
    let locationId = req.body.locationId;
    const payload = req.body.data; // Expected to be an array of objects

    if (!Array.isArray(payload) || payload.length === 0) {
      res.status(400).json({ success: false, message: 'El payload de datos está vacío o es inválido.' });
      return;
    }

    // Si el cliente no pasa una ubicación explícita, usamos la principal/primera
    if (!locationId) {
      const defaultLocation = await prisma.location.findFirst({
        where: { tenantId }
      });
      if (!defaultLocation) {
        res.status(400).json({ success: false, message: 'La empresa no tiene ninguna ubicación (Almacén) registrada.' });
        return;
      }
      locationId = defaultLocation.id;
    }

    // Ejecutar el motor
    const report = await executeBulkImportItems(tenantId, userId, locationId, payload);
    
    // Devolvemos el reporte exacto como JSON
    res.status(report.success ? 200 : 207).json(report);
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

    const report = await executeBulkImportCustomers(tenantId, userId, payload);
    
    res.status(report.success ? 200 : 207).json(report);
  } catch (error) {
    next(error);
  }
};
