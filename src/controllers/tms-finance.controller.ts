import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// ============================================================================
// TMS FINANCE & EXPENSES MODULE CONTROLLER
// ============================================================================

// ── Reportar Gasto (Chofer) o Captura Manual Excepcional (Admin) ────────────
export const createExpense = async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      tripId, 
      amount, 
      description, 
      receiptUrl, 
      isManualException, 
      manualReason,
      expenseType, // DEFAULT, TOLL, FUEL, MEAL, etc.
      fuelLiters,
      odometerReading
    } = req.body;

    const tenantId = (req as any).user?.tenantId || 'default-tenant';
    const userId = (req as any).user?.id;

    if (isManualException && !manualReason) {
      return res.status(400).json({ error: "manualReason is required when isManualException is true" });
    }

    const expense = await prisma.tripExpense.create({
      data: {
        tripId,
        amount,
        description,
        receiptUrl,
        isManualException: isManualException || false,
        manualReason: isManualException ? manualReason : null,
        status: isManualException ? 'APPROVED' : 'PENDING',
        expenseType: expenseType || 'OTHER',
        fuelLiters: fuelLiters ? Number(fuelLiters) : null,
        odometerReading: odometerReading ? Number(odometerReading) : null,
        createdByUserId: userId,
        tenantId,
      }
    });

    return res.json(expense);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ── Aprobar o Rechazar Gasto (Admin) ─────────────────────────────────────────
export const updateExpenseStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const expense = await prisma.tripExpense.update({
      where: { id },
      data: { status }
    });

    if (status === 'APPROVED') {
      const tenantId = (req as any).user?.tenantId || 'default-tenant';
      let bankAccount = await prisma.bankAccount.findFirst({
        where: { tenantId }
      });

      if (!bankAccount) {
        bankAccount = await prisma.bankAccount.create({
          data: {
            bankName: 'Caja Fuerte TMS',
            accountNumber: `TMS-${tenantId.substring(0, 8)}`,
            currentBalance: '0',
            tenantId
          }
        });
      }

      await prisma.bankMovement.create({
        data: {
          bankAccountId: bankAccount.id,
          type: 'OUT',
          amount: expense.amount.toString(),
          concept: `Gasto TMS Aprobado: ${expense.expenseType} - Viaje ${expense.tripId}`
        }
      });
      
      const currentBal = Number(bankAccount.currentBalance);
      await prisma.bankAccount.update({
        where: { id: bankAccount.id },
        data: { currentBalance: (currentBal - Number(expense.amount)).toString() }
      });
    }

    return res.json({ success: true, data: expense });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ── Liquidación de Viaje (Admin) ─────────────────────────────────────────────
export const settleTrip = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { expenses: true }
    });

    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const totalApprovedExpenses = trip.expenses
      .filter(e => e.status === 'APPROVED')
      .reduce((sum, e) => sum + Number(e.amount), 0);
      
    const advanceAmount = Number(trip.advanceAmount || 0);
    const balance = advanceAmount - totalApprovedExpenses;

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: { status: 'LIQUIDATED' }
    });

    if (balance !== 0) {
      const tenantId = (req as any).user?.tenantId || 'default-tenant';
      let bankAccount = await prisma.bankAccount.findFirst({
        where: { tenantId }
      });

      if (bankAccount) {
        const type = balance > 0 ? 'IN' : 'OUT'; // Si sobró anticipo, entra a caja. Si faltó, sale a favor del chofer.
        const absBalance = Math.abs(balance);
        
        await prisma.bankMovement.create({
          data: {
            bankAccountId: bankAccount.id,
            type,
            amount: absBalance.toString(),
            concept: `Liquidación de Viaje ${trip.tripId} - ${type === 'IN' ? 'Devolución de viáticos' : 'Reembolso a chofer'}`
          }
        });
        
        const currentBal = Number(bankAccount.currentBalance);
        await prisma.bankAccount.update({
          where: { id: bankAccount.id },
          data: { currentBalance: (type === 'IN' ? currentBal + absBalance : currentBal - absBalance).toString() }
        });
      }
    }

    return res.json({ success: true, data: { trip: updatedTrip, balance, totalApprovedExpenses } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ── Gastos Pendientes Globales (Admin) ───────────────────────────────────────
export const getPendingExpenses = async (_req: Request, res: Response): Promise<any> => {
  try {
    const expenses = await prisma.tripExpense.findMany({
      where: { status: 'PENDING' },
      include: {
        trip: {
          include: {
            truck: true,
            driver: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    return res.json({ success: true, data: expenses });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ── Actualizar Anticipo de Viaje (Admin) ───────────────────────────────────────
export const updateTripAdvance = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { advanceAmount } = req.body;
    
    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: { advanceAmount: Number(advanceAmount) }
    });
    return res.json({ success: true, data: updatedTrip });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// ── Analítica y Rentabilidad Cruzada (Admin) ─────────────────────────────────
export const getProfitability = async (req: Request, res: Response): Promise<any> => {
  try {
    const { startDate, endDate, fleetId, tripId } = req.query;

    const whereClause: any = {
      status: 'LIQUIDATED' // Solo viajes completados para la rentabilidad real
    };

    if (startDate && endDate) {
      whereClause.departureDateTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    if (fleetId) {
      whereClause.fleetId = fleetId;
    }

    if (tripId) {
      whereClause.id = tripId;
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        expenses: {
          where: { status: 'APPROVED' } // Solo gastos aprobados restan utilidad
        },
        truck: true,
        driver: true
      },
      orderBy: { departureDateTime: 'desc' }
    });

    // Calcular KPIs
    let totalRevenue = 0;
    let totalFixedCosts = 0;
    let totalVariableCosts = 0;

    const detailedTrips = trips.map(trip => {
      const revenue = Number(trip.estimatedRevenue || 0);
      const driverFee = Number(trip.driverFee || 0);
      const fixedCostsTotal = Number(trip.fixedCostsTotal || 0);
      const variableCosts = trip.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      
      const totalCosts = driverFee + fixedCostsTotal + variableCosts;
      const netProfit = revenue - totalCosts;

      totalRevenue += revenue;
      totalFixedCosts += (driverFee + fixedCostsTotal);
      totalVariableCosts += variableCosts;

      return {
        id: trip.id,
        tripId: trip.tripId,
        truckPlates: trip.truck?.plate,
        driverName: trip.driver?.name,
        departure: trip.departureDateTime,
        arrival: trip.arrivalDateTime,
        revenue,
        fixedCosts: driverFee + fixedCostsTotal,
        variableCosts,
        netProfit,
        profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0
      };
    });

    const totalCostsOperative = totalFixedCosts + totalVariableCosts;
    const netProfitTotal = totalRevenue - totalCostsOperative;
    const profitMarginTotal = totalRevenue > 0 ? (netProfitTotal / totalRevenue) * 100 : 0;

    return res.json({
      kpis: {
        totalRevenue,
        totalCostsOperative,
        totalFixedCosts,
        totalVariableCosts,
        netProfitTotal,
        profitMarginTotal
      },
      trips: detailedTrips
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
