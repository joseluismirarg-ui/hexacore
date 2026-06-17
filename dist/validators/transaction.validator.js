"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/validators/transaction.validator.ts
// Esquema de validación estricto para el endpoint de registro de transacciones.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrarTransaccionSchema = void 0;
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// Línea de item de transacción
// ---------------------------------------------------------------------------
const TransactionLineSchema = zod_1.z.object({
    productId: zod_1.z.string().cuid({ message: "productId debe ser un CUID válido" }),
    cantidad: zod_1.z
        .number({
        required_error: "cantidad es requerida",
        invalid_type_error: "cantidad debe ser un número",
    })
        .int({ message: "cantidad debe ser un entero positivo" })
        .positive({ message: "cantidad debe ser mayor a 0" }),
    precioAplicado: zod_1.z
        .number({
        required_error: "precioAplicado es requerido",
        invalid_type_error: "precioAplicado debe ser un número",
    })
        .positive({ message: "precioAplicado debe ser mayor a 0" })
        .multipleOf(0.0001, {
        message: "precioAplicado puede tener máximo 4 decimales",
    }),
});
// ---------------------------------------------------------------------------
// POST /api/v1/transacciones/registrar
// ---------------------------------------------------------------------------
exports.RegistrarTransaccionSchema = zod_1.z
    .object({
    tipo: zod_1.z.enum(["VENTA_DIRECTA", "CREDITO", "CONSIGNACION"], {
        errorMap: () => ({
            message: "tipo debe ser VENTA_DIRECTA, CREDITO o CONSIGNACION",
        }),
    }),
    customerId: zod_1.z.string().cuid({ message: "customerId debe ser un CUID válido" }),
    userId: zod_1.z.string().cuid({ message: "userId debe ser un CUID válido" }),
    // locationId: almacén desde el cual se descuenta el stock.
    // Si se omite, el controlador usará el Almacén Central (tipo: CENTRAL).
    locationId: zod_1.z
        .string()
        .cuid({ message: "locationId debe ser un CUID válido" })
        .optional(),
    total: zod_1.z
        .number({
        required_error: "total es requerido",
        invalid_type_error: "total debe ser un número",
    })
        .nonnegative({ message: "total no puede ser negativo" })
        .multipleOf(0.01, {
        message: "total puede tener máximo 2 decimales",
    }),
    items: zod_1.z
        .array(TransactionLineSchema)
        .min(1, { message: "Se requiere al menos una línea de producto" })
        .max(200, { message: "No se pueden procesar más de 200 productos por transacción" }),
});
//# sourceMappingURL=transaction.validator.js.map