import { Router } from 'express';
import { runPredictiveEngine, getPredictiveAlerts } from '../controllers/analytics.controller';

const router = Router();

router.post('/predictive/run', runPredictiveEngine);
router.get('/predictive', getPredictiveAlerts);

export default router;
