import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as ordersController from '../controllers/ordersController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

// Stats must come before :id route to avoid conflict
router.get('/stats/summary', ordersController.getOrderStats);

router.get('/', ordersController.getOrders);
router.get('/:id', ordersController.getOrder);
router.post('/', authorize('owner', 'manager', 'production'), ordersController.createOrder);
router.put('/:id', authorize('owner', 'manager', 'production'), ordersController.updateOrder);
router.patch('/:id/status', authorize('owner', 'manager', 'production'), ordersController.updateOrderStatus);
router.delete('/:id', authorize('owner', 'manager'), ordersController.deleteOrder);

export default router;
