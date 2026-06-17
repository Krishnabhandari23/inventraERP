import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as inboxController from '../controllers/inboxController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/unread-count', inboxController.getUnreadCount);
router.get('/', inboxController.getInboxItems);
router.get('/:id', inboxController.getInboxItem);
router.post('/', inboxController.sendMessage);
router.patch('/:id/read', inboxController.markAsRead);
router.patch('/:id/unread', inboxController.markAsUnread);
router.patch('/:id/archive', inboxController.archiveItem);
router.delete('/:id', inboxController.deleteItem);

export default router;
