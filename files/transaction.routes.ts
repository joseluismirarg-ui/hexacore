import { Router } from "express";
import { registrarTransaccion } from "./transaction.controller";

const router = Router();

// POST /api/v1/transacciones/registrar
router.post("/registrar", registrarTransaccion);

export default router;
