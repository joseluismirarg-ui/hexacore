// =============================================================================
// HEXA CORE SYSTEMS — src/lib/errors.ts
// Jerarquía de errores operacionales de dominio.
// Todos los errores heredan de AppError para que el errorHandler los distinga
// de errores de sistema (bugs) y les asigne el statusCode correcto.
// =============================================================================

/**
 * Error operacional base. isOperational = true indica que el error es esperado
 * y fue lanzado intencionalmente por la lógica de dominio (no es un bug).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    // Restaurar la cadena de prototipos correcta para instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 — Payload malformado o parámetro inválido */
export class BadRequestError extends AppError {
  constructor(message: string, code = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

/** 401 — Token ausente o inválido */
export class UnauthorizedError extends AppError {
  constructor(message = "No autenticado", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

/** 403 — Autenticado pero sin permisos */
export class ForbiddenError extends AppError {
  constructor(message = "Acceso denegado", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

/** 404 — Recurso no encontrado en BD */
export class NotFoundError extends AppError {
  constructor(message: string, code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

/** 409 — Conflicto de unicidad o estado incompatible */
export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(message, 409, code);
  }
}

/**
 * 422 — Entidad semánticamente inválida:
 * stock insuficiente, límite de crédito excedido, monto > deuda, etc.
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string, code = "UNPROCESSABLE_ENTITY") {
    super(message, 422, code);
  }
}

/** 500 — Error inesperado de sistema (no operacional) */
export class InternalError extends AppError {
  constructor(
    message = "Error interno del servidor",
    code = "INTERNAL_ERROR"
  ) {
    super(message, 500, code);
  }
}
