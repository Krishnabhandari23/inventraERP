import { Router } from 'express';
import { loginLimiter } from '../middleware/rateLimiter';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', loginLimiter, authController.login);
router.post('/register', loginLimiter, authController.register);
router.post('/logout', authenticate, authController.logout);
router.get('/session', authenticate, authController.getSession);
router.post('/refresh', authController.refreshToken);

export default router;
