import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as auditController from '../controllers/auditController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/', auditController.getAuditLogs);
router.get('/:id', auditController.getAuditLog);
router.get('/entity/:entityId', auditController.getEntityAuditTrail);

export default router;
