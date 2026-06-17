"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.suspendUser = exports.updateUser = exports.createUser = exports.getAllUsers = exports.getVendedores = void 0;
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const getVendedores = async (_req, res, next) => {
    try {
        const vendedores = await prisma_1.prisma.user.findMany({
            where: { role: 'VENDEDOR' },
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
const getAllUsers = async (_req, res, next) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
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
        const { email, password, name, role } = req.body;
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: { email, passwordHash, name, role },
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
        const { name, role, isActive, password } = req.body;
        const data = { name, role, isActive };
        if (password) {
            data.passwordHash = await bcrypt_1.default.hash(password, 10);
        }
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