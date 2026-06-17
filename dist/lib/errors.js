"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/lib/errors.ts
// Jerarquía de errores operacionales de dominio.
// Todos los errores heredan de AppError para que el errorHandler los distinga
// de errores de sistema (bugs) y les asigne el statusCode correcto.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalError = exports.UnprocessableEntityError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
/**
 * Error operacional base. isOperational = true indica que el error es esperado
 * y fue lanzado intencionalmente por la lógica de dominio (no es un bug).
 */
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        // Restaurar la cadena de prototipos correcta para instanceof checks
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/** 400 — Payload malformado o parámetro inválido */
class BadRequestError extends AppError {
    constructor(message, code = "BAD_REQUEST") {
        super(message, 400, code);
    }
}
exports.BadRequestError = BadRequestError;
/** 401 — Token ausente o inválido */
class UnauthorizedError extends AppError {
    constructor(message = "No autenticado", code = "UNAUTHORIZED") {
        super(message, 401, code);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/** 403 — Autenticado pero sin permisos */
class ForbiddenError extends AppError {
    constructor(message = "Acceso denegado", code = "FORBIDDEN") {
        super(message, 403, code);
    }
}
exports.ForbiddenError = ForbiddenError;
/** 404 — Recurso no encontrado en BD */
class NotFoundError extends AppError {
    constructor(message, code = "NOT_FOUND") {
        super(message, 404, code);
    }
}
exports.NotFoundError = NotFoundError;
/** 409 — Conflicto de unicidad o estado incompatible */
class ConflictError extends AppError {
    constructor(message, code = "CONFLICT") {
        super(message, 409, code);
    }
}
exports.ConflictError = ConflictError;
/**
 * 422 — Entidad semánticamente inválida:
 * stock insuficiente, límite de crédito excedido, monto > deuda, etc.
 */
class UnprocessableEntityError extends AppError {
    constructor(message, code = "UNPROCESSABLE_ENTITY") {
        super(message, 422, code);
    }
}
exports.UnprocessableEntityError = UnprocessableEntityError;
/** 500 — Error inesperado de sistema (no operacional) */
class InternalError extends AppError {
    constructor(message = "Error interno del servidor", code = "INTERNAL_ERROR") {
        super(message, 500, code);
    }
}
exports.InternalError = InternalError;
//# sourceMappingURL=errors.js.map