import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as inventoryController from '../controllers/inventoryController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

// Stats route must come before :id route
router.get('/stats', inventoryController.getInventoryStats);

router.get('/', inventoryController.getInventoryItems);
router.get('/:id', inventoryController.getInventoryItem);
router.post('/', authorize('owner', 'manager', 'production'), inventoryController.createInventoryItem);
router.put('/:id', authorize('owner', 'manager', 'production'), inventoryController.updateInventoryItem);
router.patch('/:id/adjust', authorize('owner', 'manager', 'production'), inventoryController.adjustInventory);
router.delete('/:id', authorize('owner', 'manager'), inventoryController.deleteInventoryItem);

export default router;
