import { Router } from "express";
import { getEstadoCuenta, abonarDeuda } from "./cobranza.controller";

const router = Router();

// GET /api/v1/cobranza/:customerId
router.get("/:customerId", getEstadoCuenta);

// POST /api/v1/cobranza/abonar
router.post("/abonar", abonarDeuda);

export default router;
