import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { errorHandler } from "./errorHandler";
import transactionRoutes from "./transaction.routes";
import cobranzaRoutes from "./cobranza.routes";

const app: Application = express();

// =============================================================================
// MIDDLEWARE GLOBAL
// =============================================================================
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Idempotency Key Extractor
app.use((req: Request, _res: Response, next: NextFunction) => {
  const idempotencyKey = req.header("Idempotency-Key") || req.header("idempotency-key");
  if (idempotencyKey) {
    req.idempotencyKey = idempotencyKey;
  }
  next();
});

// =============================================================================
// HEALTH CHECK
// =============================================================================
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// =============================================================================
// ROUTES
// =============================================================================
app.use("/api/v1/transacciones", transactionRoutes);
app.use("/api/v1/cobranza", cobranzaRoutes);

// =============================================================================
// 404 CATCH-ALL
// =============================================================================
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, code: "NOT_FOUND", message: "Ruta no encontrada" });
});

// =============================================================================
// ERROR HANDLER — debe ir último
// =============================================================================
app.use(errorHandler);

export default app;
