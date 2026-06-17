"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePayroll = exports.checkInOut = void 0;
const prisma_1 = require("../lib/prisma");
const checkInOut = async (req, res, next) => {
    try {
        const { userId } = req.body; // or req.user.id if using auth middleware heavily
        // Check if there is an open attendance today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const openAttendance = await prisma_1.prisma.attendance.findFirst({
            where: {
                userId,
                date: today,
                checkOut: null
            }
        });
        if (openAttendance) {
            // Check out
            const updated = await prisma_1.prisma.attendance.update({
                where: { id: openAttendance.id },
                data: { checkOut: new Date() }
            });
            res.json({ success: true, data: updated, action: 'checkout' });
        }
        else {
            // Check in
            const newAttendance = await prisma_1.prisma.attendance.create({
                data: {
                    userId,
                    date: today,
                    checkIn: new Date()
                }
            });
            res.status(201).json({ success: true, data: newAttendance, action: 'checkin' });
        }
    }
    catch (error) {
        next(error);
    }
};
exports.checkInOut = checkInOut;
const calculatePayroll = async (req, res, next) => {
    try {
        const { period } = req.query; // ej. "2026-06"
        // Simulate base salary (In real world, this could come from User model or config)
        const BASE_SALARY = 5000;
        const COMMISSION_RATE = 0.03;
        // Get all salespeople
        const users = await prisma_1.prisma.user.findMany({
            where: { role: 'VENDEDOR' },
            include: {
                transactions: {
                    where: {
                        status: 'COMPLETADO'
                        // We should filter by period ideally, but we'll sum everything for this simulation
                        // OR use prisma.$queryRaw
                    }
                }
            }
        });
        const payrolls = users.map(user => {
            const totalSales = user.transactions.reduce((acc, t) => acc + Number(t.total), 0);
            const commissions = totalSales * COMMISSION_RATE;
            const totalPaid = BASE_SALARY + commissions;
            return {
                userId: user.id,
                userName: user.name,
                period: period || 'Actual',
                baseSalary: BASE_SALARY.toString(),
                commissions: commissions.toString(),
                totalPaid: totalPaid.toString(),
            };
        });
        res.json({ success: true, data: payrolls });
    }
    catch (error) {
        next(error);
    }
};
exports.calculatePayroll = calculatePayroll;
//# sourceMappingURL=hr.controller.js.map