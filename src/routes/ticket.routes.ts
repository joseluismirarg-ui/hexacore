import { Router } from 'express';
import { createTicket, listTickets, updateTicketStatus } from '../controllers/ticket.controller';

const router = Router();

router.post('/', createTicket);
router.get('/', listTickets);
router.put('/:id/status', updateTicketStatus);

export default router;
