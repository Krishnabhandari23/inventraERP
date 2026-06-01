import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as inboxController from '../controllers/inboxController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/', inboxController.getInboxItems);
router.get('/:id', inboxController.getInboxItem);
router.patch('/:id/read', inboxController.markAsRead);
router.patch('/:id/archive', inboxController.archiveItem);
router.delete('/:id', inboxController.deleteItem);

export default router;
