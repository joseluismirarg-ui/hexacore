"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientesConsignacion = exports.updateCustomer = exports.createCustomer = exports.getClientes = void 0;
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const customerSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2),
    rfc: zod_1.z.string().min(12).max(13).optional().or(zod_1.z.literal('').transform(() => undefined)),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('').transform(() => undefined)),
    phone: zod_1.z.string().optional().or(zod_1.z.literal('').transform(() => undefined)),
    creditLimit: zod_1.z.number().or(zod_1.z.string()).transform(val => Number(val)).optional().default(0),
    creditDays: zod_1.z.number().or(zod_1.z.string()).transform(val => Number(val)).optional().default(0),
});
const getClientes = async (_req, res, next) => {
    try {
        const customers = await prisma_1.prisma.customer.findMany({
            orderBy: { companyName: 'asc' }
        });
        res.json({ success: true, data: customers });
    }
    catch (error) {
        next(error);
    }
};
exports.getClientes = getClientes;
const createCustomer = async (req, res, next) => {
    try {
        const data = customerSchema.parse(req.body);
        const customer = await prisma_1.prisma.customer.create({
            data: {
                ...data,
                currentDebt: 0
            }
        });
        res.status(201).json({ success: true, data: customer });
    }
    catch (error) {
        next(error);
    }
};
exports.createCustomer = createCustomer;
const updateCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = customerSchema.parse(req.body);
        const customer = await prisma_1.prisma.customer.update({
            where: { id },
            data,
        });
        res.status(200).json({ success: true, data: customer });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCustomer = updateCustomer;
const getClientesConsignacion = async (_req, res, next) => {
    try {
        const customers = await prisma_1.prisma.customer.findMany({
            where: {
                inventoryLocations: {
                    some: { tipo: 'CONSIGNACION_CLIENTE' }
                }
            },
            include: {
                inventoryLocations: {
                    where: { tipo: 'CONSIGNACION_CLIENTE' },
                    include: {
                        inventoryStocks: {
                            include: { item: true }
                        }
                    }
                }
            }
        });
        const data = customers.map(customer => {
            const creditLimit = customer.creditLimit.toNumber();
            const currentDebt = customer.currentDebt.toNumber();
            const porcentajeUtilizado = creditLimit > 0 ? (currentDebt / creditLimit) * 100 : 0;
            let estado = 'al_corriente';
            if (porcentajeUtilizado > 90)
                estado = 'bloqueado';
            else if (porcentajeUtilizado > 70)
                estado = 'proximo_vencer';
            const skusConsignados = customer.inventoryLocations.flatMap(loc => loc.inventoryStocks.map(stock => ({
                item: stock.item,
                cantidad: stock.quantity
            })));
            return {
                customer: {
                    id: customer.id,
                    companyName: customer.companyName,
                    creditLimit: creditLimit,
                    currentDebt: currentDebt,
                },
                skusConsignados,
                estado,
                porcentajeUtilizado
            };
        });
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getClientesConsignacion = getClientesConsignacion;
//# sourceMappingURL=cliente.controller.js.map