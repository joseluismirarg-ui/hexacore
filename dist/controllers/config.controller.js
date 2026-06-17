"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConfig = exports.getConfig = void 0;
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const configSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2),
    companyRfc: zod_1.z.string().min(12).max(13),
    taxRegimen: zod_1.z.string().min(3),
    posTimeout: zod_1.z.number().int().min(60).max(3600),
});
const getConfig = async (_req, res, next) => {
    try {
        let config = await prisma_1.prisma.systemConfig.findFirst();
        if (!config) {
            config = await prisma_1.prisma.systemConfig.create({
                data: {
                    id: 'default',
                    companyName: 'Hexa Core Systems',
                    companyRfc: 'XAXX010101000',
                    taxRegimen: '601',
                    posTimeout: 300,
                }
            });
        }
        res.json({ success: true, data: config });
    }
    catch (error) {
        next(error);
    }
};
exports.getConfig = getConfig;
const updateConfig = async (req, res, next) => {
    try {
        const data = configSchema.parse(req.body);
        let config = await prisma_1.prisma.systemConfig.findFirst();
        if (config) {
            config = await prisma_1.prisma.systemConfig.update({
                where: { id: config.id },
                data
            });
        }
        else {
            config = await prisma_1.prisma.systemConfig.create({
                data: { ...data, id: 'default' }
            });
        }
        res.json({ success: true, data: config });
    }
    catch (error) {
        next(error);
    }
};
exports.updateConfig = updateConfig;
//# sourceMappingURL=config.controller.js.map