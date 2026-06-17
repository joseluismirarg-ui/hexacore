"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/transaction.controller.ts
// Lógica transaccional pura para registro de ventas B2B.
//
// DECRETOS APLICADOS:
// [D1] Precisión Decimal — Prisma.Decimal para todos los valores monetarios.
// [D2] Idempotencia — busca UUID antes de abrir TX; HTTP 200 si ya existe.
// [D3] Desnorm. sincrónica — Product.globalStock actualizado dentro de la TX.
// [D4] Guard anti-race — updateMany con quantity: { gte: cantidad }.
// [D5] currentDebt inicializado en código, no en BD.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarTransaccion = registrarTransaccion;
exports.getTransaccion = getTransaccion;
exports.listarTransacciones = listarTransacciones;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const transaction_validator_1 = require("../validators/transaction.validator");
const errors_1 = require("../lib/errors");
// =============================================================================
// POST /api/v1/transacciones/registrar
// =============================================================================
async function registrarTransaccion(req, res, next) {
    try {
        // ── Validación del payload ───────────────────────────────────────────────
        const dto = transaction_validator_1.RegistrarTransaccionSchema.parse(req.body);
        const idempotencyKey = req.idempotencyKey;
        // ── [D2] Verificación de idempotencia ────────────────────────────────────
        // Si el cliente proveyó un Idempotency-Key y ya existe una TX con ese UUID,
        // retornamos el registro existente SIN crear una nueva TX (HTTP 200 seguro).
        if (idempotencyKey) {
            const existingTx = await prisma_1.prisma.transaction.findUnique({
                where: { uuid: idempotencyKey },
                include: { items: true },
            });
            if (existingTx) {
                res.status(200).json({
                    success: true,
                    idempotent: true,
                    message: "Transacción recuperada — idempotency-key ya procesada",
                    data: existingTx,
                });
                return;
            }
        }
        // ── Pre-validaciones (lecturas rápidas fuera de la TX atómica) ───────────
        // Mantenerlas fuera de la TX reduce el tiempo de bloqueo en PostgreSQL.
        const customer = await prisma_1.prisma.customer.findUnique({
            where: { id: dto.customerId },
        });
        if (!customer) {
            throw new errors_1.NotFoundError(`Cliente '${dto.customerId}' no encontrado`);
        }
        const vendedor = await prisma_1.prisma.user.findUnique({
            where: { id: dto.userId },
        });
        if (!vendedor) {
            throw new errors_1.NotFoundError(`Usuario/Vendedor '${dto.userId}' no encontrado`);
        }
        // ── [D5] Validación de límite de crédito ─────────────────────────────────
        // Solo aplica para CREDITO y CONSIGNACION (VENTA_DIRECTA es pago inmediato).
        if (dto.tipo === "CREDITO" || dto.tipo === "CONSIGNACION") {
            const saldoDisponible = customer.creditLimit
                .sub(customer.currentDebt)
                .toDecimalPlaces(2);
            const totalRequerido = new client_1.Prisma.Decimal(dto.total);
            if (totalRequerido.greaterThan(saldoDisponible)) {
                throw new errors_1.UnprocessableEntityError(`Límite de crédito insuficiente. ` +
                    `Disponible: $${saldoDisponible.toFixed(2)}, ` +
                    `Requerido: $${totalRequerido.toFixed(2)}`, "CREDITO_INSUFICIENTE");
            }
        }
        // ── Resolver ubicación de inventario ─────────────────────────────────────
        // Si el payload incluye locationId, se descuenta de esa ubicación.
        // Si no, se usa el Almacén Central como fuente canónica por defecto.
        let locationId;
        if (dto.locationId) {
            const locationExists = await prisma_1.prisma.inventoryLocation.findUnique({
                where: { id: dto.locationId },
            });
            if (!locationExists) {
                throw new errors_1.NotFoundError(`Ubicación de inventario '${dto.locationId}' no encontrada`);
            }
            locationId = dto.locationId;
        }
        else {
            const almacenCentral = await prisma_1.prisma.inventoryLocation.findFirst({
                where: { tipo: "CENTRAL" },
            });
            if (!almacenCentral) {
                throw new errors_1.InternalError("Almacén Central no configurado. Ejecuta el seed o crea una ubicación CENTRAL.");
            }
            locationId = almacenCentral.id;
        }
        // =========================================================================
        // TRANSACCIÓN ATÓMICA — Nivel de aislamiento SERIALIZABLE
        // Garantiza que ninguna otra TX pueda leer stock desactualizado entre
        // nuestro updateMany y el commit. Timeout 10s para evitar bloqueos largos.
        // =========================================================================
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // ── Paso 1: Crear la transacción maestra ─────────────────────────────
            // Si hay idempotency-key, la usamos como UUID; PostgreSQL no la genera
            // automáticamente en este caso — la proveemos explícitamente.
            const transaction = await tx.transaction.create({
                data: {
                    ...(idempotencyKey ? { uuid: idempotencyKey } : {}),
                    tipo: dto.tipo,
                    status: "COMPLETADO",
                    total: new client_1.Prisma.Decimal(dto.total),
                    userId: dto.userId,
                    customerId: dto.customerId,
                    items: {
                        create: dto.items.map((item) => ({
                            productId: item.productId,
                            cantidad: item.cantidad,
                            precioAplicado: new client_1.Prisma.Decimal(item.precioAplicado),
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: { id: true, sku: true, name: true },
                            },
                        },
                    },
                    customer: {
                        select: { id: true, companyName: true },
                    },
                    user: {
                        select: { id: true, name: true },
                    },
                },
            });
            // ── Paso 2: Descontar stock con guard anti-race ───────────────────────
            // [D4] updateMany con guard `quantity: { gte: cantidad }` garantiza
            // que la query solo actualiza si hay stock suficiente.
            // Si count === 0: otra TX ganó la carrera (o el stock es 0) → rollback.
            for (const item of dto.items) {
                // [D4] Guard anti-race en InventoryStock
                const stockUpdateResult = await tx.inventoryStock.updateMany({
                    where: {
                        locationId: locationId,
                        productId: item.productId,
                        quantity: { gte: item.cantidad }, // Guard: no permite stock negativo
                    },
                    data: {
                        quantity: { decrement: item.cantidad },
                    },
                });
                if (stockUpdateResult.count === 0) {
                    // Obtenemos el stock actual para dar un mensaje preciso al caller
                    const stockActual = await tx.inventoryStock.findFirst({
                        where: {
                            locationId: locationId,
                            productId: item.productId,
                        },
                        select: { quantity: true },
                    });
                    const disponible = stockActual?.quantity ?? 0;
                    throw new errors_1.UnprocessableEntityError(`Stock insuficiente para el producto '${item.productId}'. ` +
                        `Disponible: ${disponible}, Solicitado: ${item.cantidad}`, "STOCK_INSUFICIENTE");
                }
                // [D3] Desnormalización sincrónica: mantener Product.globalStock alineado
                // con la suma de InventoryStock.quantity de forma atómica.
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        globalStock: { decrement: item.cantidad },
                    },
                });
            }
            // ── Paso 3: Actualizar deuda del cliente ─────────────────────────────
            // Solo para CREDITO y CONSIGNACION. VENTA_DIRECTA es pago inmediato.
            if (dto.tipo === "CREDITO" || dto.tipo === "CONSIGNACION") {
                await tx.customer.update({
                    where: { id: dto.customerId },
                    data: {
                        currentDebt: {
                            increment: new client_1.Prisma.Decimal(dto.total),
                        },
                    },
                });
            }
            // ── Paso 4: Audit Log atómico ─────────────────────────────────────────
            await tx.auditLog.create({
                data: {
                    accion: `REGISTRO_TRANSACCION_${dto.tipo}`,
                    detalles: {
                        transactionId: transaction.id,
                        transactionUuid: transaction.uuid,
                        tipo: dto.tipo,
                        total: dto.total,
                        customerId: dto.customerId,
                        userId: dto.userId,
                        locationId: locationId,
                        itemCount: dto.items.length,
                        idempotencyKey: idempotencyKey ?? null,
                    },
                    userId: dto.userId,
                },
            });
            return transaction;
        }, {
            isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
            timeout: 10_000, // 10 segundos máximo para evitar bloqueos largos
        });
        res.status(201).json({
            success: true,
            idempotent: false,
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// GET /api/v1/transacciones/:id
// =============================================================================
async function getTransaccion(req, res, next) {
    try {
        const { id } = req.params;
        const transaction = await prisma_1.prisma.transaction.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, sku: true, name: true, price: true },
                        },
                    },
                },
                customer: {
                    select: { id: true, companyName: true },
                },
                user: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!transaction) {
            throw new errors_1.NotFoundError(`Transacción '${id}' no encontrada`);
        }
        res.status(200).json({ success: true, data: transaction });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// GET /api/v1/transacciones
// Listado paginado con filtros opcionales
// =============================================================================
async function listarTransacciones(req, res, next) {
    try {
        const { customerId, userId, status, tipo, page = "1", limit = "20", } = req.query;
        const take = Math.min(parseInt(limit, 10) || 20, 100);
        const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
        const where = {
            ...(customerId ? { customerId } : {}),
            ...(userId ? { userId } : {}),
            ...(status
                ? { status: status }
                : {}),
            ...(tipo ? { tipo: tipo } : {}),
        };
        const [transactions, total] = await Promise.all([
            prisma_1.prisma.transaction.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take,
                include: {
                    customer: { select: { id: true, companyName: true } },
                    user: { select: { id: true, name: true } },
                    _count: { select: { items: true } },
                },
            }),
            prisma_1.prisma.transaction.count({ where }),
        ]);
        res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page: Math.max(parseInt(page, 10) || 1, 1),
                limit: take,
                totalPages: Math.ceil(total / take),
            },
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=transaction.controller.js.map