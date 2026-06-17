import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tenantContext } from '../middleware/tenant.middleware';
import { getIO } from '../lib/socket';

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = tenantContext.getStore() || 'default-tenant';
    const userId = (req as any).user?.id;
    const { subject, body, priority = 'NORMAL' } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        body,
        priority,
        tenantId,
        userId
      }
    });

    // Notificar al Admin
    getIO().to('admin_room').emit('notification', {
      title: '🎫 Nuevo Ticket de Soporte',
      message: `Asunto: ${ticket.subject} (Prioridad: ${ticket.priority})`
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Error al crear el ticket' });
  }
};

export const listTickets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = tenantContext.getStore();
    
    let whereClause: any = {};
    if (tenantId && tenantId !== 'default-tenant') {
      whereClause.tenantId = tenantId;
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true }
        },
        tenant: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
};

export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Solo un admin o el super admin debería hacer esto en producción.
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status }
    });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
};
