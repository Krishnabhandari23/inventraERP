import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import * as invisController from '../controllers/invisController';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);

router.get('/capabilities', invisController.getInvisCapabilities);
router.post('/', invisController.processInvisMessage);

export default router;
