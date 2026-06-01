import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as billingController from '../controllers/billingController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/subscription', billingController.getSubscription);
router.post('/checkout', billingController.createCheckoutSession);
router.post('/portal', billingController.createPortalSession);
router.get('/usage', billingController.getUsageMetrics);
router.post('/upgrade', authorize('owner'), billingController.upgradePlan);

export default router;
