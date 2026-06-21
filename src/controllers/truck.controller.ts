import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { tenantContext } from '../middleware/tenant.middleware';

export class TruckController {
  
  // ===========================================================================
  // TRUCKS
  // ===========================================================================

  static async getTrucks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const trucks = await prisma.truck.findMany({
        where: { tenantId },
        include: { drivers: true }
      });
      res.status(200).json({ success: true, data: trucks });
    } catch (err) { next(err); }
  }

  static async createTruck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const { plate, make, model, year } = req.body;
      const truck = await prisma.truck.create({
        data: {
          plate, make, model, year: year ? parseInt(year) : null,
          tenantId
        }
      });
      res.status(201).json({ success: true, data: truck });
    } catch (err) { next(err); }
  }

  static async updateTruckStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const { id } = req.params;
      const { status, locationJson } = req.body;
      
      const truck = await prisma.truck.update({
        where: { id, tenantId },
        data: { 
          status,
          ...(locationJson && { locationJson })
        }
      });
      res.status(200).json({ success: true, data: truck });
    } catch (err) { next(err); }
  }

  // ===========================================================================
  // DRIVERS
  // ===========================================================================

  static async getDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const drivers = await prisma.driver.findMany({
        where: { tenantId },
        include: { currentTruck: true }
      });
      res.status(200).json({ success: true, data: drivers });
    } catch (err) { next(err); }
  }

  static async createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const { name, licenseNumber, phone, currentTruckId } = req.body;
      const driver = await prisma.driver.create({
        data: {
          name, licenseNumber, phone,
          currentTruckId: currentTruckId || null,
          tenantId
        }
      });
      res.status(201).json({ success: true, data: driver });
    } catch (err) { next(err); }
  }

  static async updateDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const { id } = req.params;
      const { isAvailable, currentTruckId } = req.body;
      const driver = await prisma.driver.update({
        where: { id, tenantId },
        data: { 
          ...(isAvailable !== undefined && { isAvailable }),
          ...(currentTruckId !== undefined && { currentTruckId })
        }
      });
      res.status(200).json({ success: true, data: driver });
    } catch (err) { next(err); }
  }

  // ===========================================================================
  // LOGISTICS CLIENTS
  // ===========================================================================

  static async getClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const clients = await prisma.logisticsClient.findMany({ where: { tenantId } });
      res.status(200).json({ success: true, data: clients });
    } catch (err) { next(err); }
  }

  static async createClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const { name, billingContact, deliveryAddress, phone, email } = req.body;
      const client = await prisma.logisticsClient.create({
        data: {
          name, billingContact, deliveryAddress, phone, email, tenantId
        }
      });
      res.status(201).json({ success: true, data: client });
    } catch (err) { next(err); }
  }

  // ===========================================================================
  // TRIPS & EXPENSES
  // ===========================================================================

  static async getTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const trips = await prisma.trip.findMany({
        where: { tenantId },
        include: {
          truck: true,
          driver: true,
          client: true,
          expenses: true,
          stops: {
            orderBy: { sequence: 'asc' }
          }
        },
        orderBy: { departureDateTime: 'desc' }
      });
      res.status(200).json({ success: true, data: trips });
    } catch (err) { next(err); }
  }

  static async dispatchTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const { 
        tripId, cargoDescription, originAddress, destinationAddress, 
        truckId, driverId, clientId, departureDateTime, 
        estimatedRevenue, stops,
        fleetId, driverFee, fixedCostsTotal, fixedCostsDetails
      } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        const trip = await tx.trip.create({
          data: {
            tripId, cargoDescription, originAddress, destinationAddress,
            truckId, driverId, clientId, tenantId,
            fleetId,
            estimatedRevenue: estimatedRevenue ? Number(estimatedRevenue) : 0,
            driverFee: driverFee ? Number(driverFee) : 0,
            fixedCostsTotal: fixedCostsTotal ? Number(fixedCostsTotal) : 0,
            fixedCostsDetails: fixedCostsDetails || null,
            departureDateTime: departureDateTime ? new Date(departureDateTime) : new Date(),
            stops: stops && Array.isArray(stops) ? {
              create: stops.map((stop: any, index: number) => ({
                sequence: index + 1,
                customerName: stop.customerName,
                address: stop.address,
                phone: stop.phone,
                lat: stop.lat ? Number(stop.lat) : null,
                lng: stop.lng ? Number(stop.lng) : null,
              }))
            } : undefined
          }
        });

        // Set truck status to IN_TRANSIT
        await tx.truck.update({
          where: { id: truckId },
          data: { status: 'IN_TRANSIT' }
        });

        // Update driver's current truck if needed
        await tx.driver.update({
          where: { id: driverId },
          data: { currentTruckId: truckId, isAvailable: false }
        });

        return trip;
      });

      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  static async completeTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const { id } = req.params;
      const { arrivalDateTime } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        // Validar que no queden paradas PENDIENTES
        const pendingStops = await tx.tripStop.count({
          where: { tripId: id, status: 'PENDING' }
        });

        if (pendingStops > 0) {
          throw new Error(`Restricción TMS: No se puede completar el viaje. Hay ${pendingStops} paradas pendientes.`);
        }

        const trip = await tx.trip.update({
          where: { id, tenantId },
          data: { 
            status: 'LIQUIDATED',
            arrivalDateTime: arrivalDateTime ? new Date(arrivalDateTime) : new Date() 
          }
        });

        // Free up the truck
        await tx.truck.update({
          where: { id: trip.truckId },
          data: { status: 'AWAITING_LOAD' } // Or 'AVAILABLE'
        });

        // Free up driver
        await tx.driver.update({
          where: { id: trip.driverId },
          data: { isAvailable: true }
        });

        return trip;
      });

      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      if (err.message.includes('Restricción TMS')) {
        res.status(400).json({ error: err.message });
      } else {
        next(err);
      }
    }
  }

  static async completeTripStop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { stopId } = req.params;
      const { signatureUrl, photoUrl, notes } = req.body;

      const stop = await prisma.tripStop.update({
        where: { id: stopId },
        data: {
          status: 'DELIVERED',
          signatureUrl,
          photoUrl,
          notes,
          deliveredAt: new Date()
        }
      });

      res.status(200).json({ success: true, data: stop });
    } catch (err) { next(err); }
  }

  static async failTripStop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { stopId } = req.params;
      const { notes, photoUrl } = req.body;
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId || "default-tenant";
      const userId = (req as any).user?.id || "default-user";

      const stop = await prisma.tripStop.update({
        where: { id: stopId },
        data: {
          status: 'ISSUE',
          notes,
          photoUrl,
          deliveredAt: new Date()
        },
        include: { trip: true }
      });

      // Evento Asíncrono de Entrega Fallida (log en AuditLog)
      // Idealmente aquí se usaría un Message Broker (RabbitMQ/Kafka)
      // Simulamos la asincronía emitiendo un log con un webhook interno
      setTimeout(async () => {
        try {
          await prisma.auditLog.create({
            data: {
              accion: "TMS_ENTREGA_FALLIDA",
              detalles: {
                stopId: stop.id,
                tripId: stop.tripId,
                customer: stop.customerName,
                reason: notes
              },
              tenantId,
              userId
            }
          });
          // Se dispararía un WebSocket a Logística
        } catch (e) {
          console.error("Error asíncrono al reportar entrega fallida", e);
        }
      }, 0);

      res.status(200).json({ success: true, data: stop });
    } catch (err) { next(err); }
  }

}
