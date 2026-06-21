import { Router } from 'express';
import { TruckController } from '../controllers/truck.controller';

import { checkTenantLimit } from '../middleware/tenantLimitsMiddleware';

const router = Router();

// Logistics Clients
router.get('/clients', TruckController.getClients);
router.post('/clients', TruckController.createClient);

// Trucks
router.get('/', TruckController.getTrucks);
router.post('/', checkTenantLimit('Truck'), TruckController.createTruck);
router.patch('/:id/status', TruckController.updateTruckStatus);

// Drivers
router.get('/drivers', TruckController.getDrivers);
router.post('/drivers', TruckController.createDriver);
router.patch('/drivers/:id', TruckController.updateDriver);

import { createExpense, updateExpenseStatus, getProfitability, settleTrip, getPendingExpenses, updateTripAdvance } from '../controllers/tms-finance.controller';

// Trips
router.get('/trips', TruckController.getTrips);
router.post('/trips/dispatch', TruckController.dispatchTrip);
router.post('/trips/:id/complete', TruckController.completeTrip);
router.post('/trips/stops/:stopId/complete', TruckController.completeTripStop);
router.post('/trips/stops/:stopId/fail', TruckController.failTripStop);

// TMS Finance & Expenses
router.get('/expenses/pending', getPendingExpenses);
router.post('/trips/expenses', createExpense);
router.patch('/trips/expenses/:id/status', updateExpenseStatus);
router.post('/trips/:id/settle', settleTrip);
router.patch('/trips/:id/advance', updateTripAdvance);
router.get('/analytics/profitability', getProfitability);

export default router;
