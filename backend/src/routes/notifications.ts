import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as notificationsController from '../controllers/notificationsController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/', notificationsController.getNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);
router.patch('/:id/read', notificationsController.markNotificationAsRead);
router.patch('/mark-all-read', notificationsController.markAllNotificationsAsRead);

export default router;
