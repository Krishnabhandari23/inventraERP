import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as usageController from '../controllers/usageController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.post('/track', usageController.trackUsage);
router.get('/report', usageController.getUsageReport);

export default router;
