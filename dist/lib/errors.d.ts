/**
 * Error operacional base. isOperational = true indica que el error es esperado
 * y fue lanzado intencionalmente por la lógica de dominio (no es un bug).
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, code: string);
}
/** 400 — Payload malformado o parámetro inválido */
export declare class BadRequestError extends AppError {
    constructor(message: string, code?: string);
}
/** 401 — Token ausente o inválido */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string);
}
/** 403 — Autenticado pero sin permisos */
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string);
}
/** 404 — Recurso no encontrado en BD */
export declare class NotFoundError extends AppError {
    constructor(message: string, code?: string);
}
/** 409 — Conflicto de unicidad o estado incompatible */
export declare class ConflictError extends AppError {
    constructor(message: string, code?: string);
}
/**
 * 422 — Entidad semánticamente inválida:
 * stock insuficiente, límite de crédito excedido, monto > deuda, etc.
 */
export declare class UnprocessableEntityError extends AppError {
    constructor(message: string, code?: string);
}
/** 500 — Error inesperado de sistema (no operacional) */
export declare class InternalError extends AppError {
    constructor(message?: string, code?: string);
}
//# sourceMappingURL=errors.d.ts.map