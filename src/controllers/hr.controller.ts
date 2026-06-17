import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const checkInOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body; // or req.user.id if using auth middleware heavily
    
    // Check if there is an open attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const openAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: today,
        checkOut: null
      }
    });

    if (openAttendance) {
      // Check out
      const updated = await prisma.attendance.update({
        where: { id: openAttendance.id },
        data: { checkOut: new Date() }
      });
      res.json({ success: true, data: updated, action: 'checkout' });
    } else {
      // Check in
      const newAttendance = await prisma.attendance.create({
        data: {
          userId,
          date: today,
          checkIn: new Date()
        }
      });
      res.status(201).json({ success: true, data: newAttendance, action: 'checkin' });
    }
  } catch (error) {
    next(error);
  }
};

export const calculatePayroll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period } = req.query; // ej. "2026-06"
    
    // Get all users with employee profiles
    const users = await prisma.user.findMany({
      where: { employeeProfile: { isNot: null } },
      include: {
        employeeProfile: true,
        transactions: {
          where: {
            status: 'COMPLETADO'
            // In a real app we'd filter transactions strictly by period
          }
        }
      }
    });

    const payrolls = users.map(user => {
      const profile = user.employeeProfile;
      if (!profile) return null;

      const baseSalary = Number(profile.salaryBase) || 0;
      let commissions = 0;

      if (profile.earnCommission && profile.commissionPercentage) {
        const rate = Number(profile.commissionPercentage) / 100;
        const totalSales = user.transactions.reduce((acc, t) => acc + Number(t.total), 0);
        commissions = totalSales * rate;
      }

      const totalPaid = baseSalary + commissions;

      return {
        userId: user.id,
        userName: user.name,
        period: period || 'Actual',
        baseSalary: baseSalary.toFixed(2),
        commissions: commissions.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
      };
    }).filter(Boolean);

    res.json({ success: true, data: payrolls });
  } catch (error) {
    next(error);
  }
};

export const requestLeave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, type, startDate, endDate, reason } = req.body;
    
    const leave = await prisma.leaveRequest.create({
      data: {
        userId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason
      }
    });

    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
};

export const approveLeave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APROBADO or RECHAZADO

    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
};
