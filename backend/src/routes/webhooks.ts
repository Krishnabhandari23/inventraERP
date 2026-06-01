import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as webhooksController from '../controllers/webhooksController';

const router = Router();

// Webhook endpoints for external services (no auth required)
router.post('/stripe', webhooksController.handleStripeWebhook);
router.post('/inventra', webhooksController.handleInventraWebhook);

// Management endpoints (auth required)
router.use(authenticate);
router.get('/', webhooksController.getWebhooks);
router.post('/register', webhooksController.registerWebhook);
router.put('/:id', webhooksController.updateWebhook);
router.delete('/:id', webhooksController.deleteWebhook);
router.get('/logs', webhooksController.getWebhookLogs);

export default router;
