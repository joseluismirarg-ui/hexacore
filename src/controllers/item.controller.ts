// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/item.controller.ts
// CRUD completo del catálogo de productos.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  CrearProductoSchema,
  ActualizarProductoSchema,
} from '../validators/item.validator';
import { NotFoundError, ConflictError } from '../lib/errors';
import { tenantContext } from '../middleware/tenant.middleware';
import { checkTenantLimits } from '../utils/limits';

// =============================================================================
// GET /api/v1/productos
// Listado paginado con búsqueda opcional por nombre/SKU
// =============================================================================
export async function listarProductos(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { q, page = '1', limit = '50' } = req.query as Record<string, string>;
    const take = Math.min(parseInt(limit, 10) || 50, 200);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where: Prisma.ItemWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.item.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      prisma.item.count({ where }),
    ]);

    res.json({
      success: true,
      data: items,
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
// GET /api/v1/productos/:id
// =============================================================================
export async function getProducto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        inventoryStocks: { include: { location: true } },
      },
    });
    if (!item) throw new NotFoundError(`Producto '${req.params.id}' no encontrado`);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// POST /api/v1/productos
// =============================================================================
export async function crearProducto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = CrearProductoSchema.parse(req.body);
    const tenantId = tenantContext.getStore() as string;
    
    // Check SaaS limits before creating
    await checkTenantLimits(tenantId, 'ITEMS');

    const exists = await prisma.item.findUnique({ where: { sku: dto.sku } });
    if (exists) throw new ConflictError(`El SKU '${dto.sku}' ya existe en el catálogo`);

    const item = await prisma.item.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        cost: new Prisma.Decimal(dto.cost),
        price: new Prisma.Decimal(dto.price),
        globalStock: 0,
      },
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// PATCH /api/v1/productos/:id
// =============================================================================
export async function actualizarProducto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = ActualizarProductoSchema.parse(req.body);

    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) throw new NotFoundError(`Producto '${req.params.id}' no encontrado`);

    if (dto.sku && dto.sku !== item.sku) {
      const skuExists = await prisma.item.findUnique({ where: { sku: dto.sku } });
      if (skuExists) throw new ConflictError(`El SKU '${dto.sku}' ya está en uso`);
    }

    const updated = await prisma.item.update({
      where: { id: req.params.id },
      data: {
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.cost !== undefined && { cost: new Prisma.Decimal(dto.cost) }),
        ...(dto.price !== undefined && { price: new Prisma.Decimal(dto.price) }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// DELETE /api/v1/productos/:id
// =============================================================================
export async function eliminarProducto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) throw new NotFoundError(`Producto '${req.params.id}' no encontrado`);

    await prisma.item.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (err: any) {
    if (err.code === 'P2003') {
      res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar el producto porque tiene movimientos de inventario, historial o recetas asociadas.' 
      });
      return;
    }
    next(err);
  }
}
