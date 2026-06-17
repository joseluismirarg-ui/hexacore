import { Router } from 'express';
import { getClientes, getClientesConsignacion, createCustomer } from '../controllers/cliente.controller';

const router = Router();

router.get('/', getClientes);
router.post('/', createCustomer);
router.get('/consignaciones', getClientesConsignacion);

export default router;
