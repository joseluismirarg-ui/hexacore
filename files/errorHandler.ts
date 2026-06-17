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

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV === "development";

  // ── Zod validation errors ──────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      success: false,
      code: "VALIDATION_ERROR",
      message: "Payload inválido",
      errors: err.flatten().fieldErrors,
    };
    res.status(422).json(response);
    return;
  }

  // ── Domain / operational errors ────────────────────────────────────────────
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

  // ── Prisma known errors ────────────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res
        .status(404)
        .json({ success: false, code: "NOT_FOUND", message: "Registro no encontrado" });
      return;
    }
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        code: "CONFLICT",
        message: "Registro duplicado",
        errors: err.meta,
      });
      return;
    }
  }

  // ── Unhandled errors ───────────────────────────────────────────────────────
  console.error("[UNHANDLED_ERROR]", err);
  const response: ErrorResponse = {
    success: false,
    code: "INTERNAL_ERROR",
    message: "Error interno del servidor",
    ...(isDev && { stack: err instanceof Error ? err.stack : String(err) }),
  };
  res.status(500).json(response);
}
