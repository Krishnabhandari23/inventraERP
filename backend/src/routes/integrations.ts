import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as integrationsController from '../controllers/integrationsController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/', integrationsController.getIntegrations);
router.post('/connect', authorize('owner', 'manager'), integrationsController.connectIntegration);
router.delete('/:id', authorize('owner', 'manager'), integrationsController.disconnectIntegration);
router.post('/:id/sync', integrationsController.syncIntegration);

export default router;
