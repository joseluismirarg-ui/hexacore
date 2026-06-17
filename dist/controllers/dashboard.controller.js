"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = void 0;
const prisma_1 = require("../lib/prisma");
const getDashboardMetrics = async (_req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Caja Diaria (Ventas Directas o Crédito completadas hoy)
        const transactionsToday = await prisma_1.prisma.transaction.aggregate({
            where: {
                createdAt: { gte: today },
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
        // Eficiencia de Cobranza (Calculado de forma mock o por una fórmula de la empresa)
        const eficienciaCobranza = 85;
        // Weekly flow data
        const weekly = [
            { dia: 'Lun', ventas: 1200, cobros: 800 },
            { dia: 'Mar', ventas: 1500, cobros: 1000 },
            { dia: 'Mié', ventas: 900, cobros: 750 },
            { dia: 'Jue', ventas: 2100, cobros: 1500 },
            { dia: 'Vie', ventas: 1800, cobros: 1200 },
            { dia: 'Sáb', ventas: 2500, cobros: 2000 },
            { dia: 'Dom', ventas: 0, cobros: 0 },
        ];
        // Audit logs (últimos 20)
        const logs = await prisma_1.prisma.auditLog.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardMetrics = getDashboardMetrics;
//# sourceMappingURL=dashboard.controller.js.map