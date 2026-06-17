// =============================================================================
// HEXA CORE SYSTEMS — src/middleware/errorHandler.ts
// Middleware de manejo centralizado de errores de Express.
// Debe registrarse DESPUÉS de todas las rutas en app.ts.
// =============================================================================

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors";

interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  errors?: unknown;
  stack?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV === "development";

  // ── 1. Errores de validación de Zod (422) ───────────────────────────────────
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      success: false,
      code: "VALIDATION_ERROR",
      message: "Payload inválido — revisa los campos marcados en 'errors'",
      errors: err.flatten().fieldErrors,
    };
    res.status(422).json(response);
    return;
  }

  // ── 2. Errores operacionales de dominio (AppError y subclases) ───────────────
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      code: err.code,
      message: err.message,
      ...(isDev && { stack: err.stack }),
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // ── 3. Errores conocidos de Prisma ──────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: Record not found (findUniqueOrThrow, updateOrThrow, etc.)
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "El registro solicitado no existe en la base de datos",
        ...(isDev && { meta: err.meta }),
      } satisfies ErrorResponse);
      return;
    }

    // P2002: Unique constraint violation
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        code: "CONFLICT",
        message: "Ya existe un registro con los mismos datos únicos",
        errors: err.meta,
        ...(isDev && { stack: err.stack }),
      } satisfies ErrorResponse);
      return;
    }

    // P2003: Foreign key constraint violation
    if (err.code === "P2003") {
      res.status(422).json({
        success: false,
        code: "FOREIGN_KEY_VIOLATION",
        message: "La operación viola una restricción de integridad referencial",
        errors: err.meta,
      } satisfies ErrorResponse);
      return;
    }

    // P2034: Transaction conflict / serialization failure — retry hint
    if (err.code === "P2034") {
      res.status(409).json({
        success: false,
        code: "TRANSACTION_CONFLICT",
        message:
          "Conflicto de transacción serializable. Vuelve a intentar la operación.",
      } satisfies ErrorResponse);
      return;
    }
  }

  // ── 4. Errores de validación de Prisma (payload malformado) ─────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      code: "PRISMA_VALIDATION_ERROR",
      message: "Los datos enviados a la base de datos son inválidos",
      ...(isDev && { detail: err.message }),
    } satisfies ErrorResponse);
    return;
  }

  // ── 5. Errores de sistema no manejados ──────────────────────────────────────
  console.error("[UNHANDLED_ERROR]", err);

  const response: ErrorResponse = {
    success: false,
    code: "INTERNAL_ERROR",
    message: "Error interno del servidor",
    ...(isDev && { stack: err instanceof Error ? err.stack : String(err) }),
  };
  res.status(500).json(response);
}
