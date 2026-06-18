import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from 'bcrypt';
import { Prisma } from "@prisma/client";

// ============================================================================
// HR MODULE CONTROLLER (Isolated & Expanded)
// ============================================================================

// ── Empleados (Directorio y Perfiles) ───────────────────────────────────────
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const employees = await prisma.user.findMany({
      where: { tenantId },
      include: { employeeProfile: true },
      orderBy: { name: 'asc' }
    });
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const { 
      name, email, role, password, 
      employeeCode, rfc, curp, phone, emergencyContact,
      salaryBase, salaryPeriod, shiftStartTime,
      earnCommission, commissionPercentage,
      productivityBonus, punctualityBonus, attendanceBonus
    } = req.body;

    const passwordHash = await bcrypt.hash(password || '123456', 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          role,
          passwordHash,
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // userId
    const { 
      name, email, role,
      employeeCode, rfc, curp, phone, emergencyContact,
      salaryBase, salaryPeriod, shiftStartTime,
      earnCommission, commissionPercentage,
      productivityBonus, punctualityBonus, attendanceBonus
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { name, email, role }
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ── Asistencia y Puntualidad ───────────────────────────────────────────────
export const checkInOut = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ error: "User required" });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar si ya hay un registro hoy
    const existing = await prisma.attendance.findFirst({
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
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: { checkOut: new Date() }
      });
      res.json(updated);
    } else {
      // Check in
      const attendance = await prisma.attendance.create({
        data: {
          date: today,
          checkIn: new Date(),
          userId,
          tenantId: tenantId!,
        },
      });
      res.status(201).json(attendance);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttendanceDashboard = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendances = await prisma.attendance.findMany({
      where: { tenantId, date: today },
      include: { 
        user: {
          select: { id: true, name: true, employeeProfile: true }
        }
      }
    });

    res.json(attendances);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ── Control de Rutas (Vendedores) ──────────────────────────────────────────
export const registerRouteVisit = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const userId = (req as any).user?.id;
    const { customerId, notes } = req.body;

    if (!userId || !customerId) {
      res.status(400).json({ error: "Faltan datos obligatorios" });
      return;
    }

    const visit = await prisma.routeVisit.create({
      data: {
        userId,
        customerId,
        notes,
        tenantId
      }
    });

    res.status(201).json(visit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRouteVisits = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const today = new Date();
    today.setHours(0,0,0,0);

    const visits = await prisma.routeVisit.findMany({
      where: { 
        tenantId,
        visitDate: { gte: today }
      },
      include: {
        user: { select: { id: true, name: true }},
        customer: { select: { id: true, companyName: true }}
      },
      orderBy: { visitDate: 'desc' }
    });

    res.json(visits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ── Nómina (Placeholder) ───────────────────────────────────────────────────
export const calculatePayroll = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const payrolls = await prisma.payroll.findMany({
      where: { tenantId },
    });
    res.json(payrolls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const requestLeave = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const userId = (req as any).user?.id;
    const { type, startDate, endDate, reason } = req.body;

    if (!userId) {
      res.status(401).json({ error: "User required" });
      return;
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        userId,
        tenantId: tenantId!,
      },
    });
    res.status(201).json(leave);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const approveLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: { status: "APROBADO" },
    });
    res.json(leave);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
