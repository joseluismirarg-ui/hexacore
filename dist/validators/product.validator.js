"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/validators/product.validator.ts
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActualizarProductoSchema = exports.CrearProductoSchema = void 0;
const zod_1 = require("zod");
// Regex para validar strings numéricos de Decimal (ej. "1234.5678")
const decimalString = (label) => zod_1.z
    .string({ required_error: `${label} es requerido` })
    .trim()
    .regex(/^\d+(\.\d{1,4})?$/, {
    message: `${label} debe ser un número decimal positivo con máximo 4 decimales (ej. "99.9900")`,
});
exports.CrearProductoSchema = zod_1.z.object({
    sku: zod_1.z
        .string({ required_error: 'sku es requerido' })
        .trim()
        .min(2, 'sku debe tener al menos 2 caracteres')
        .max(50, 'sku no puede exceder 50 caracteres')
        .toUpperCase(),
    name: zod_1.z
        .string({ required_error: 'name es requerido' })
        .trim()
        .min(2, 'name debe tener al menos 2 caracteres')
        .max(200),
    description: zod_1.z.string().trim().max(500).optional(),
    cost: decimalString('cost'),
    price: decimalString('price'),
});
exports.ActualizarProductoSchema = exports.CrearProductoSchema.partial();
//# sourceMappingURL=product.validator.js.map