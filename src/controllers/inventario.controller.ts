// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/inventario.controller.ts
// Traspasos entre almacenes y consulta de Kardex.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { TraspasoSchema } from '../validators/inventory.validator';
import {
  NotFoundError,
  UnprocessableEntityError,
} from '../lib/errors';

// =============================================================================
// GET /api/v1/inventario/camiones
// Lista las ubicaciones de tipo MOVIL con su stock
// =============================================================================
export async function getCamiones(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const camiones = await prisma.inventoryLocation.findMany({
      where: { tipo: 'MOVIL' },
      include: {
        inventoryStocks: {
          include: {
            item: {
              select: { id: true, sku: true, name: true, price: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: camiones });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GET /api/v1/inventario/camiones/:id/liquidacion
// Datos de liquidación para un camión específico
// =============================================================================
export async function getLiquidacion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const camion = await prisma.inventoryLocation.findUnique({
      where: { id: req.params.id },
      include: {
        inventoryStocks: {
          include: { item: true },
        },
      },
    });

    if (!camion) throw new NotFoundError(`Camión '${req.params.id}' no encontrado`);

    const productos = camion.inventoryStocks.map((s) => {
      const precio = s.item.price.toNumber();
      return {
        item: {
          id: s.item.id,
          sku: s.item.sku,
          name: s.item.name,
          price: s.item.price.toString(),
        },
        cargado: s.quantity,
        devuelto: 0,
        vendido: 0,
        montoEsperado: s.quantity * precio,
      };
    });

    const efectivoEsperado = productos.reduce((sum, p) => sum + p.montoEsperado, 0);

    res.json({
      success: true,
      data: {
        camion: { id: camion.id, name: camion.name, tipo: camion.tipo },
        productos,
        efectivoEsperado,
        efectivoEntregado: 0,
        discrepancia: 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GET /api/v1/inventario/almacenes
// Lista todos los almacenes con su stock
// =============================================================================
export async function getAlmacenes(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const almacenes = await prisma.location.findMany({
      include: {
        inventories: {
          include: {
            item: { select: { id: true, sku: true, name: true, globalStock: true } },
          },
          take: 10,
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = almacenes.map((w: any) => ({
      id: w.id,
      name: w.name,
      tipo: 'CENTRAL',
      inventoryStocks: w.inventories,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// POST /api/v1/inventario/traspaso
// Mueve inventario entre almacenes atomicamente y registra en Kardex.
// =============================================================================
export async function registrarTraspaso(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = TraspasoSchema.parse(req.body);

    // Pre-validaciones fuera de TX para mensajes de error precisos
    const [item, origen, destino, usuario] = await Promise.all([
      prisma.item.findUnique({ where: { id: dto.itemId } }),
      prisma.inventoryLocation.findUnique({ where: { id: dto.locationOrigenId } }),
      prisma.inventoryLocation.findUnique({ where: { id: dto.locationDestinoId } }),
      prisma.user.findUnique({ where: { id: dto.userId } }),
    ]);

    if (!item) throw new NotFoundError(`Producto '${dto.itemId}' no encontrado`);
    if (!origen) throw new NotFoundError(`Almacén origen '${dto.locationOrigenId}' no encontrado`);
    if (!destino) throw new NotFoundError(`Almacén destino '${dto.locationDestinoId}' no encontrado`);
    if (!usuario) throw new NotFoundError(`Usuario '${dto.userId}' no encontrado`);

    // =========================================================================
    // TRANSACCIÓN ATÓMICA — SERIALIZABLE
    // 1. Descontar stock del almacén origen (con guard anti-negativo)
    // 2. Incrementar stock en almacén destino (upsert)
    // 3. Registrar movimiento en Kardex
    // =========================================================================
    const kardex = await prisma.$transaction(
      async (tx) => {
        // Paso 1: Descontar origen con guard anti-race
        const originUpdate = await tx.inventoryStock.updateMany({
          where: {
            locationId: dto.locationOrigenId,
            itemId: dto.itemId,
            quantity: { gte: dto.cantidad },
          },
          data: { quantity: { decrement: dto.cantidad } },
        });

        if (originUpdate.count === 0) {
          const stockOrigen = await tx.inventoryStock.findFirst({
            where: { locationId: dto.locationOrigenId, itemId: dto.itemId },
            select: { quantity: true },
          });
          const disponible = stockOrigen?.quantity ?? 0;
          throw new UnprocessableEntityError(
            `Stock insuficiente en almacén origen. Disponible: ${disponible}, Solicitado: ${dto.cantidad}`,
            'STOCK_INSUFICIENTE'
          );
        }

        // Paso 2: Incrementar destino (upsert — puede no existir el registro)
        await tx.inventoryStock.upsert({
          where: {
            locationId_itemId: {
              locationId: dto.locationDestinoId,
              itemId: dto.itemId,
            },
          },
          create: {
            locationId: dto.locationDestinoId,
            itemId: dto.itemId,
            quantity: dto.cantidad,
          },
          update: { quantity: { increment: dto.cantidad } },
        });

        // Paso 3: Registrar en Kardex (inmutable)
        const movimiento = await tx.kardexMovement.create({
          data: {
            tipo: 'TRASPASO',
            cantidad: dto.cantidad,
            locationOrigenId: dto.locationOrigenId,
            locationDestinoId: dto.locationDestinoId,
            itemId: dto.itemId,
            userId: dto.userId,
            notes: dto.notes,
          },
          include: {
            item: { select: { id: true, sku: true, name: true } },
            user: { select: { id: true, name: true } },
          },
        });

        return movimiento;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10_000 }
    );

    res.status(201).json({ success: true, data: kardex });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GET /api/v1/inventario/kardex/:itemId
// Historial inmutable de movimientos de un producto (paginado)
// =============================================================================
export async function getKardex(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { itemId } = req.params;
    const { page = '1', limit = '50' } = req.query as Record<string, string>;
    const take = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundError(`Producto '${itemId}' no encontrado`);

    const [movements, total] = await Promise.all([
      prisma.kardexMovement.findMany({
        where: { itemId },
        orderBy: { timestamp: 'desc' },
        skip,
        take,
        include: {
          item: { select: { id: true, sku: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.kardexMovement.count({ where: { itemId } }),
    ]);

    res.json({
      success: true,
      data: movements,
      pagination: {
        total,
        page: Math.max(parseInt(page, 10) || 1, 1),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GET /api/v1/inventario/kardex (todos los movimientos)
// =============================================================================
export async function getAllKardex(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = '1', limit = '50', tipo } = req.query as Record<string, string>;
    const take = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where: Prisma.KardexMovementWhereInput = tipo
      ? { tipo: tipo as Prisma.EnumKardexMovementTypeFilter }
      : {};

    const [movements, total] = await Promise.all([
      prisma.kardexMovement.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take,
        include: {
          item: { select: { id: true, sku: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.kardexMovement.count({ where }),
    ]);

    res.json({
      success: true,
      data: movements,
      pagination: {
        total,
        page: Math.max(parseInt(page, 10) || 1, 1),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    next(err);
  }
}
