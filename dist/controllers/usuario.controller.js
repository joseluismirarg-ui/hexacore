"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suspendUser = exports.updateUser = exports.createUser = exports.getAllUsers = exports.getVendedores = void 0;
const prisma_1 = require("../lib/prisma");
const crypto_1 = require("crypto");
const getVendedores = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;
        const vendedores = await prisma_1.prisma.user.findMany({
            where: tenantId ? { role: 'VENDEDOR', tenantId } : { role: 'VENDEDOR' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            }
        });
        res.json({ success: true, data: vendedores });
    }
    catch (error) {
        next(error);
    }
};
exports.getVendedores = getVendedores;
const getAllUsers = async (req, res, next) => {
    try {
        const tenantId = req.user?.tenantId;
        const users = await prisma_1.prisma.user.findMany({
            where: tenantId ? { tenantId } : undefined,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
            },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: users });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
const createUser = async (req, res, next) => {
    try {
        const { email, name, role } = req.body;
        const tenantId = req.user?.tenantId;
        const user = await prisma_1.prisma.user.create({
            data: { id: (0, crypto_1.randomUUID)(), email, name, role, tenantId },
            select: { id: true, email: true, name: true, role: true, isActive: true }
        });
        res.status(201).json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, role, isActive } = req.body;
        const data = { name, email, role, isActive };
        // password is handled by supabase
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data,
            select: { id: true, email: true, name: true, role: true, isActive: true }
        });
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
const suspendUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: { id: true, email: true, name: true, role: true, isActive: true }
        });
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
};
exports.suspendUser = suspendUser;
//# sourceMappingURL=usuario.controller.js.map