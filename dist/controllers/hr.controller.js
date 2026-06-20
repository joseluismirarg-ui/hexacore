"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveLeave = exports.requestLeave = exports.calculatePayroll = exports.getRouteVisits = exports.registerRouteVisit = exports.getAttendanceDashboard = exports.checkInOut = exports.updateEmployee = exports.createEmployee = exports.getEmployees = void 0;
const prisma_1 = require("../lib/prisma");
const crypto_1 = require("crypto");
// ============================================================================
// HR MODULE CONTROLLER (Isolated & Expanded)
// ============================================================================
// ── Empleados (Directorio y Perfiles) ───────────────────────────────────────
const getEmployees = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const employees = await prisma_1.prisma.user.findMany({
            where: { tenantId },
            include: { employeeProfile: true },
            orderBy: { name: 'asc' }
        });
        res.json(employees);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getEmployees = getEmployees;
const createEmployee = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const { name, email, role, employeeCode, rfc, curp, phone, emergencyContact, salaryBase, salaryPeriod, shiftStartTime, earnCommission, commissionPercentage, productivityBonus, punctualityBonus, attendanceBonus } = req.body;
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    name,
                    email,
                    role,
                    tenantId
                }
            });
            const profile = await tx.employeeProfile.create({
                data: {
                    userId: user.id,
                    employeeCode,
                    rfc: rfc || `RFC-${Date.now()}`, // Temporary fallback if empty
                    curp: curp || `CURP-${Date.now()}`,
                    phone: phone || '',
                    emergencyContact,
                    salaryBase: salaryBase || '0',
                    salaryPeriod: salaryPeriod || 'QUINCENAL',
                    shiftStartTime: shiftStartTime || '09:00',
                    earnCommission: earnCommission || false,
                    commissionPercentage: commissionPercentage || '0.00',
                    productivityBonus: productivityBonus || 0,
                    punctualityBonus: punctualityBonus || 0,
                    attendanceBonus: attendanceBonus || 0
                }
            });
            return { user, profile };
        });
        res.status(201).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params; // userId
        const { name, email, role, employeeCode, rfc, curp, phone, emergencyContact, salaryBase, salaryPeriod, shiftStartTime, earnCommission, commissionPercentage, productivityBonus, punctualityBonus, attendanceBonus } = req.body;
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const dataToUpdate = {};
            if (name)
                dataToUpdate.name = name;
            if (email)
                dataToUpdate.email = email;
            if (role)
                dataToUpdate.role = role;
            const user = await tx.user.update({
                where: { id },
                data: dataToUpdate
            });
            const profile = await tx.employeeProfile.upsert({
                where: { userId: id },
                update: {
                    employeeCode, rfc, curp, phone, emergencyContact,
                    salaryBase, salaryPeriod, shiftStartTime,
                    earnCommission, commissionPercentage,
                    productivityBonus, punctualityBonus, attendanceBonus
                },
                create: {
                    userId: id,
                    employeeCode, rfc: rfc || `RFC-${Date.now()}`, curp: curp || `CURP-${Date.now()}`, phone: phone || '', emergencyContact,
                    salaryBase: salaryBase || '0', salaryPeriod: salaryPeriod || 'QUINCENAL', shiftStartTime: shiftStartTime || '09:00',
                    earnCommission: earnCommission || false, commissionPercentage: commissionPercentage || '0.00',
                    productivityBonus: productivityBonus || 0, punctualityBonus: punctualityBonus || 0, attendanceBonus: attendanceBonus || 0
                }
            });
            return { user, profile };
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateEmployee = updateEmployee;
// ── Asistencia y Puntualidad ───────────────────────────────────────────────
const checkInOut = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "User required" });
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Buscar si ya hay un registro hoy
        const existing = await prisma_1.prisma.attendance.findFirst({
            where: {
                userId,
                date: today
            }
        });
        if (existing) {
            // Check out
            if (existing.checkOut) {
                res.status(400).json({ error: "Ya registraste entrada y salida hoy." });
                return;
            }
            const updated = await prisma_1.prisma.attendance.update({
                where: { id: existing.id },
                data: { checkOut: new Date() }
            });
            res.json(updated);
        }
        else {
            // Check in
            const attendance = await prisma_1.prisma.attendance.create({
                data: {
                    date: today,
                    checkIn: new Date(),
                    userId,
                    tenantId: tenantId,
                },
            });
            res.status(201).json(attendance);
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.checkInOut = checkInOut;
const getAttendanceDashboard = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const attendances = await prisma_1.prisma.attendance.findMany({
            where: { tenantId, date: today },
            include: {
                user: {
                    select: { id: true, name: true, employeeProfile: true }
                }
            }
        });
        res.json(attendances);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAttendanceDashboard = getAttendanceDashboard;
// ── Control de Rutas (Vendedores) ──────────────────────────────────────────
const registerRouteVisit = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const userId = req.user?.id;
        const { customerId, notes } = req.body;
        if (!userId || !customerId) {
            res.status(400).json({ error: "Faltan datos obligatorios" });
            return;
        }
        const visit = await prisma_1.prisma.routeVisit.create({
            data: {
                userId,
                customerId,
                notes,
                tenantId
            }
        });
        res.status(201).json(visit);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.registerRouteVisit = registerRouteVisit;
const getRouteVisits = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const visits = await prisma_1.prisma.routeVisit.findMany({
            where: {
                tenantId,
                visitDate: { gte: today }
            },
            include: {
                user: { select: { id: true, name: true } },
                customer: { select: { id: true, companyName: true } }
            },
            orderBy: { visitDate: 'desc' }
        });
        res.json(visits);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getRouteVisits = getRouteVisits;
// ── Nómina (Placeholder) ───────────────────────────────────────────────────
const calculatePayroll = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const payrolls = await prisma_1.prisma.payroll.findMany({
            where: { tenantId },
        });
        res.json(payrolls);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.calculatePayroll = calculatePayroll;
const requestLeave = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const userId = req.user?.id;
        const { type, startDate, endDate, reason } = req.body;
        if (!userId) {
            res.status(401).json({ error: "User required" });
            return;
        }
        const leave = await prisma_1.prisma.leaveRequest.create({
            data: {
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                userId,
                tenantId: tenantId,
            },
        });
        res.status(201).json(leave);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.requestLeave = requestLeave;
const approveLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const leave = await prisma_1.prisma.leaveRequest.update({
            where: { id },
            data: { status: "APROBADO" },
        });
        res.json(leave);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.approveLeave = approveLeave;
//# sourceMappingURL=hr.controller.js.map