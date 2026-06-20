"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = void 0;
const prisma_1 = require("../lib/prisma");
const getDashboardMetrics = async (req, res, next) => {
    try {
        const range = req.query.range || 'today';
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        let endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        if (range === 'yesterday') {
            startDate.setDate(startDate.getDate() - 1);
            endDate.setDate(endDate.getDate() - 1);
        }
        else if (range === 'last3days') {
            startDate.setDate(startDate.getDate() - 3);
        }
        else if (range === 'last7days') {
            startDate.setDate(startDate.getDate() - 7);
        }
        else if (range === 'thisMonth') {
            startDate.setDate(1);
        }
        else if (range === 'lastMonth') {
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setDate(1);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        else if (range === 'thisYear') {
            startDate.setMonth(0, 1);
        }
        else if (range === 'lastYear') {
            startDate.setFullYear(startDate.getFullYear() - 1, 0, 1);
            endDate = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        }
        else if (range === 'allTime') {
            startDate = new Date(2000, 0, 1);
        }
        // Caja Diaria (Ventas Directas o Crédito completadas hoy/periodo)
        const transactionsToday = await prisma_1.prisma.transaction.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                tipo: { in: ['VENTA_DIRECTA', 'CREDITO'] },
                status: 'COMPLETADO'
            },
            _sum: { total: true }
        });
        const cajaDiaria = transactionsToday._sum.total?.toNumber() || 0;
        // Inventario en Consignación
        const consignacionStock = await prisma_1.prisma.inventoryStock.aggregate({
            where: {
                location: { tipo: 'CONSIGNACION_CLIENTE' }
            },
            _sum: { quantity: true }
        });
        const inventarioConsignacion = consignacionStock._sum.quantity || 0;
        // Cartera Vencida (Suma de la deuda actual de clientes)
        const customersDebt = await prisma_1.prisma.customer.aggregate({
            _sum: { currentDebt: true }
        });
        const carteraVencida = customersDebt._sum.currentDebt?.toNumber() || 0;
        // Eficiencia de Cobranza (Cobrado vs (Deuda + Cobrado)) en el periodo seleccionado
        const totalPayments = await prisma_1.prisma.payment.aggregate({
            where: { date: { gte: startDate, lte: endDate } },
            _sum: { amount: true }
        });
        const paid = totalPayments._sum.amount?.toNumber() || 0;
        const totalDebt = carteraVencida;
        const eficienciaCobranza = totalDebt + paid > 0 ? Math.round((paid / (totalDebt + paid)) * 100) : 0;
        // Weekly flow data - Dynamic (now based on the selected period)
        const txsThisWeek = await prisma_1.prisma.transaction.findMany({
            where: { createdAt: { gte: startDate, lte: endDate } },
            select: { createdAt: true, total: true }
        });
        const paymentsThisWeek = await prisma_1.prisma.payment.findMany({
            where: { date: { gte: startDate, lte: endDate } },
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
            if (entry)
                entry.ventas += tx.total.toNumber();
        });
        paymentsThisWeek.forEach(p => {
            const dayName = daysMap[p.date.getDay()];
            const entry = weeklyData.find(w => w.dia === dayName);
            if (entry)
                entry.cobros += p.amount.toNumber();
        });
        const weekly = weeklyData;
        // Audit logs (últimos 20, filtrados por fecha)
        const logs = await prisma_1.prisma.auditLog.findMany({
            where: { timestamp: { gte: startDate, lte: endDate } },
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { timestamp: 'desc' },
            take: 20
        });
        res.json({
            success: true,
            data: {
                metrics: [
                    { title: 'Caja (Periodo)', value: cajaDiaria },
                    { title: 'Inventario en Consignación', value: inventarioConsignacion },
                    { title: 'Cartera Vencida', value: carteraVencida },
                    { title: 'Eficiencia de Cobranza', value: eficienciaCobranza },
                ],
                weekly,
                logs
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardMetrics = getDashboardMetrics;
//# sourceMappingURL=dashboard.controller.js.map