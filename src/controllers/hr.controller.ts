import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// ============================================================================
// HR MODULE CONTROLLER (Isolated)
// ============================================================================

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const employees = await prisma.employeeProfile.findMany({
      where: { user: { tenantId } },
      include: { user: true },
    });
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const checkInOut = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ error: "User required" });
      return;
    }

    const attendance = await prisma.attendance.create({
      data: {
        date: new Date(),
        checkIn: new Date(),
        userId,
        tenantId: tenantId!,
      },
    });
    res.status(201).json(attendance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

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
