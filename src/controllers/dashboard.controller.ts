import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const getDashboardMetrics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Caja Diaria (Ventas Directas o Crédito completadas hoy)
    const transactionsToday = await prisma.transaction.aggregate({
      where: {
        createdAt: { gte: today },
        tipo: { in: ['VENTA_DIRECTA', 'CREDITO'] },
        status: 'COMPLETADO'
      },
      _sum: { total: true }
    });
    const cajaDiaria = transactionsToday._sum.total?.toNumber() || 0;

    // Inventario en Consignación
    const consignacionStock = await prisma.inventoryStock.aggregate({
      where: {
        location: { tipo: 'CONSIGNACION_CLIENTE' }
      },
      _sum: { quantity: true }
    });
    const inventarioConsignacion = consignacionStock._sum.quantity || 0;

    // Cartera Vencida (Suma de la deuda actual de clientes)
    const customersDebt = await prisma.customer.aggregate({
      _sum: { currentDebt: true }
    });
    const carteraVencida = customersDebt._sum.currentDebt?.toNumber() || 0;

    // Eficiencia de Cobranza (Cobrado vs (Deuda + Cobrado))
    const totalPayments = await prisma.payment.aggregate({ _sum: { amount: true } });
    const paid = totalPayments._sum.amount?.toNumber() || 0;
    const totalDebt = carteraVencida;
    const eficienciaCobranza = totalDebt + paid > 0 ? Math.round((paid / (totalDebt + paid)) * 100) : 0;

    // Weekly flow data - Dynamic
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Lunes
    startOfWeek.setHours(0, 0, 0, 0);

    const txsThisWeek = await prisma.transaction.findMany({
      where: { createdAt: { gte: startOfWeek } },
      select: { createdAt: true, total: true }
    });
    
    // We would fetch payments here as well for "cobros", assuming for now transactions as both or just simple mock distribution for payments
    const paymentsThisWeek = await prisma.payment.findMany({
      where: { date: { gte: startOfWeek } },
      select: { date: true, amount: true }
    });

    const daysMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weeklyData = [
      { dia: 'Lun', ventas: 0, cobros: 0 },
      { dia: 'Mar', ventas: 0, cobros: 0 },
      { dia: 'Mié', ventas: 0, cobros: 0 },
      { dia: 'Jue', ventas: 0, cobros: 0 },
      { dia: 'Vie', ventas: 0, cobros: 0 },
      { dia: 'Sáb', ventas: 0, cobros: 0 },
      { dia: 'Dom', ventas: 0, cobros: 0 },
    ];

    txsThisWeek.forEach(tx => {
      const dayName = daysMap[tx.createdAt.getDay()];
      const entry = weeklyData.find(w => w.dia === dayName);
      if (entry) entry.ventas += tx.total.toNumber();
    });

    paymentsThisWeek.forEach(p => {
      const dayName = daysMap[p.date.getDay()];
      const entry = weeklyData.find(w => w.dia === dayName);
      if (entry) entry.cobros += p.amount.toNumber();
    });

    const weekly = weeklyData;

    // Audit logs (últimos 20)
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: {
        metrics: [
          { title: 'Caja Diaria', value: cajaDiaria },
          { title: 'Inventario en Consignación', value: inventarioConsignacion },
          { title: 'Cartera Vencida', value: carteraVencida },
          { title: 'Eficiencia de Cobranza', value: eficienciaCobranza },
        ],
        weekly,
        logs
      }
    });
  } catch (error) {
    next(error);
  }
};
