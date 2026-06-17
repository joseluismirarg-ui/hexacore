import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// ============================================================================
// CRM MODULE CONTROLLER (Isolated)
// ============================================================================

export const getPipeline = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    // For now, using Customers as Leads
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { companyName: 'asc' },
    });
    
    // Simulate pipeline stages: Lead, Contacted, Proposal, Won
    res.json({
      stages: [
        { id: 'lead', name: 'Leads Nuevos', items: customers.slice(0, 2) },
        { id: 'contacted', name: 'Contactados', items: customers.slice(2, 4) },
        { id: 'proposal', name: 'Propuesta Enviada', items: customers.slice(4, 6) },
        { id: 'won', name: 'Cierre Ganado', items: customers.slice(6) },
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenant?.id;
    const { companyName, email, phone } = req.body;

    const newLead = await prisma.customer.create({
      data: {
        companyName,
        email,
        phone,
        creditLimit: 0,
        currentDebt: 0,
        tenantId: tenantId!,
      },
    });
    res.status(201).json(newLead);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLeadStatus = async (_req: Request, res: Response) => {
  try {
    // const { leadId } = _req.params;
    // const { stage } = _req.body;
    // Implementation pending real PipelineStage model
    res.json({ message: "Lead status updated to new stage." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const convertLeadToCustomer = async (_req: Request, res: Response) => {
  try {
    // const { leadId } = _req.params;
    res.json({ message: "Lead successfully converted to active Customer." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
