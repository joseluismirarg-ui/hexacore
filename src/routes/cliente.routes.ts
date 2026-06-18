import { Router } from 'express';
import { getClientes, getClientesConsignacion, createCustomer, updateCustomer } from '../controllers/cliente.controller';

const router = Router();

router.get('/', getClientes);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.get('/consignaciones', getClientesConsignacion);

export default router;
