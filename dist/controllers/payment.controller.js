"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/payment.controller.ts
// Registro de pagos/abonos y actualización atómica de currentDebt.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarPago = registrarPago;
exports.getPagosByCliente = getPagosByCliente;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const payment_validator_1 = require("../validators/payment.validator");
const errors_1 = require("../lib/errors");
// =============================================================================
// POST /api/v1/pagos
// Registra un pago y decrementa atomicamente la deuda del cliente.
// =============================================================================
async function registrarPago(req, res, next) {
    try {
        const dto = payment_validator_1.RegistrarPagoSchema.parse(req.body);
        const amountDecimal = new client_1.Prisma.Decimal(dto.amount);
        // Pre-validaciones fuera de TX
        const customer = await prisma_1.prisma.customer.findUnique({ where: { id: dto.customerId } });
        if (!customer)
            throw new errors_1.NotFoundError(`Cliente '${dto.customerId}' no encontrado`);
        // Validar que el cliente tenga deuda
        if (customer.currentDebt.isZero()) {
            throw new errors_1.UnprocessableEntityError('El cliente no tiene deuda pendiente.', 'DEUDA_CERO');
        }
        // El pago no puede exceder la deuda actual
        if (amountDecimal.greaterThan(customer.currentDebt)) {
            throw new errors_1.UnprocessableEntityError(`El pago ($${amountDecimal.toFixed(2)}) excede la deuda actual ` +
                `($${customer.currentDebt.toFixed(2)}). No se admiten saldos a favor.`, 'PAGO_EXCEDE_DEUDA');
        }
        // Verificar transacción asociada si se proveyó
        if (dto.transactionId) {
            const tx = await prisma_1.prisma.transaction.findUnique({ where: { id: dto.transactionId } });
            if (!tx)
                throw new errors_1.NotFoundError(`Transacción '${dto.transactionId}' no encontrada`);
            if (tx.customerId !== dto.customerId) {
                throw new errors_1.UnprocessableEntityError('La transacción no pertenece al cliente especificado', 'MISMATCH_CLIENTE');
            }
        }
        // =========================================================================
        // TRANSACCIÓN ATÓMICA — SERIALIZABLE
        // =========================================================================
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // Registrar el pago
            const payment = await tx.payment.create({
                data: {
                    amount: amountDecimal,
                    method: dto.method,
                    customerId: dto.customerId,
                    transactionId: dto.transactionId ?? null,
                    notes: dto.notes ?? null,
                },
            });
            // Decrementar deuda atómicamente
            const updatedCustomer = await tx.customer.update({
                where: { id: dto.customerId },
                data: { currentDebt: { decrement: amountDecimal } },
            });
            return { payment, updatedCustomer };
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, timeout: 8_000 });
        res.status(201).json({
            success: true,
            data: {
                paymentId: result.payment.id,
                customerId: dto.customerId,
                companyName: customer.companyName,
                monto: dto.amount,
                method: dto.method,
                deudaAnterior: customer.currentDebt.toString(),
                deudaNueva: result.updatedCustomer.currentDebt.toString(),
                saldoDisponible: result.updatedCustomer.creditLimit
                    .sub(result.updatedCustomer.currentDebt)
                    .toFixed(2),
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// GET /api/v1/pagos/cliente/:customerId
// Historial de pagos de un cliente
// =============================================================================
async function getPagosByCliente(req, res, next) {
    try {
        const { customerId } = req.params;
        const { page = '1', limit = '20' } = req.query;
        const take = Math.min(parseInt(limit, 10) || 20, 100);
        const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
        const customer = await prisma_1.prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer)
            throw new errors_1.NotFoundError(`Cliente '${customerId}' no encontrado`);
        const [payments, total] = await Promise.all([
            prisma_1.prisma.payment.findMany({
                where: { customerId },
                orderBy: { date: 'desc' },
                skip,
                take,
                include: {
                    transaction: { select: { id: true, tipo: true, total: true } },
                },
            }),
            prisma_1.prisma.payment.count({ where: { customerId } }),
        ]);
        res.json({
            success: true,
            data: {
                customer: {
                    id: customer.id,
                    companyName: customer.companyName,
                    currentDebt: customer.currentDebt.toString(),
                    creditLimit: customer.creditLimit.toString(),
                },
                payments,
            },
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
//# sourceMappingURL=payment.controller.js.map