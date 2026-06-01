import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as salesController from '../controllers/salesController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

// Stats routes must come before :id route to avoid conflicts
router.get('/stats/revenue', salesController.getRevenueStats);
router.get('/stats/top-customers', salesController.getTopCustomers);

router.get('/', salesController.getInvoices);
router.get('/:id', salesController.getInvoice);
router.post('/', authorize('owner', 'manager', 'finance'), salesController.createInvoice);
router.put('/:id', authorize('owner', 'manager', 'finance'), salesController.updateInvoice);
router.patch('/:id/status', authorize('owner', 'manager', 'finance'), salesController.updateInvoiceStatus);
router.delete('/:id', authorize('owner', 'manager'), salesController.deleteInvoice);

export default router;
