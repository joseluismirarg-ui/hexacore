"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/validators/cobranza.validator.ts
// Esquema de validación para operaciones de cobranza y estado de cuenta.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbonarDeudaSchema = void 0;
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// POST /api/v1/cobranza/abonar
// ---------------------------------------------------------------------------
exports.AbonarDeudaSchema = zod_1.z.object({
    customerId: zod_1.z.string().cuid({ message: "customerId debe ser un CUID válido" }),
    userId: zod_1.z.string().cuid({ message: "userId debe ser un CUID válido" }),
    monto: zod_1.z
        .number({
        required_error: "monto es requerido",
        invalid_type_error: "monto debe ser un número",
    })
        .positive({ message: "El monto debe ser mayor a 0" })
        .multipleOf(0.01, { message: "El monto puede tener máximo 2 decimales" }),
    notas: zod_1.z
        .string({ invalid_type_error: "notas debe ser texto" })
        .max(500, { message: "notas no puede exceder 500 caracteres" })
        .optional(),
});
//# sourceMappingURL=cobranza.validator.js.map