import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as productionController from '../controllers/productionController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

// Jobs routes
router.get('/jobs', productionController.getProductionOrders);
router.get('/jobs/:id', productionController.getProductionOrder);
router.post('/jobs', authorize('owner', 'manager', 'production'), productionController.createProductionOrder);
router.put('/jobs/:id', authorize('owner', 'manager', 'production'), productionController.updateProductionOrder);
router.patch('/jobs/:id/status', authorize('owner', 'manager', 'production'), productionController.updateProductionStatus);
router.patch('/jobs/:id/progress', authorize('owner', 'manager', 'production'), productionController.updateProductionStatus);
router.delete('/jobs/:id', authorize('owner', 'manager', 'production'), productionController.deleteProductionJob);

// Schedule routes
router.get('/schedule', productionController.getProductionSchedule);

export default router;
