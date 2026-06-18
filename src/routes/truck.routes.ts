import { Router } from 'express';
import { TruckController } from '../controllers/truck.controller';

const router = Router();

// Logistics Clients
router.get('/clients', TruckController.getClients);
router.post('/clients', TruckController.createClient);

// Trucks
router.get('/', TruckController.getTrucks);
router.post('/', TruckController.createTruck);
router.patch('/:id/status', TruckController.updateTruckStatus);

// Drivers
router.get('/drivers', TruckController.getDrivers);
router.post('/drivers', TruckController.createDriver);
router.patch('/drivers/:id', TruckController.updateDriver);

// Trips
router.get('/trips', TruckController.getTrips);
router.post('/trips/dispatch', TruckController.dispatchTrip);
router.post('/trips/:id/complete', TruckController.completeTrip);
router.post('/trips/:id/expenses', TruckController.addTripExpense);

export default router;
