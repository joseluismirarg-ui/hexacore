import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Middleware para asegurar que el usuario es chofer
const requireDriver = (req: Request, res: Response, next: NextFunction) => {
  const role = (req as any).user?.role;
  // Permitimos ADMIN para pruebas
  if (role !== 'CHOFER' && role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Acceso denegado: Se requiere rol de Chofer' });
  }
  next();
};

// GET /api/driver/trips/active
// Retorna el viaje activo del chofer autenticado, junto con stops ordenadas
router.get('/trips/active', requireAuth, requireDriver, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;

    const activeTrip = await prisma.trip.findFirst({
      where: {
        tenantId,
        arrivalDateTime: null
      },
      include: {
        stops: {
          orderBy: { sequence: 'asc' }
        },
        client: true,
        truck: true
      },
      orderBy: { departureDateTime: 'asc' }
    });

    if (!activeTrip) {
      res.json({ success: true, data: null, message: 'No hay viajes activos' });
      return;
    }

    res.json({ success: true, data: activeTrip });
  } catch (error) {
    next(error);
  }
});

// PUT /api/driver/stops/:stopId/status
// Actualiza el estatus de la parada
router.put('/stops/:stopId/status', requireAuth, requireDriver, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stopId } = req.params;
    const { status, notes, signatureUrl, photoUrl } = req.body;
    const tenantId = (req as any).user?.tenantId;

    const stop = await prisma.tripStop.findFirst({
      where: { id: stopId, trip: { tenantId } }
    });

    if (!stop) {
      res.status(404).json({ success: false, message: 'Parada no encontrada' });
      return;
    }

    const updateData: any = { status };
    if (notes !== undefined) updateData.notes = notes;
    if (signatureUrl !== undefined) updateData.signatureUrl = signatureUrl;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();

    const updatedStop = await prisma.tripStop.update({
      where: { id: stopId },
      data: updateData
    });

    res.json({ success: true, data: updatedStop });
  } catch (error) {
    next(error);
  }
});

export default router;
