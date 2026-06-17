import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as approvalsController from '../controllers/approvalsController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/pending/my', approvalsController.getMyPendingApprovals);
router.get('/', approvalsController.getApprovals);
router.get('/:id', approvalsController.getApproval);
router.post('/', approvalsController.createApproval);
router.patch('/:id/approve', authorize('owner', 'manager', 'finance'), approvalsController.approveRequest);
router.patch('/:id/reject', authorize('owner', 'manager', 'finance'), approvalsController.rejectRequest);
router.patch('/:id', authorize('owner', 'manager', 'finance'), approvalsController.updateApprovalStatus);

export default router;
