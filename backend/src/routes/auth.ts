import { Router } from 'express';
import { loginLimiter } from '../middleware/rateLimiter';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { loginValidation, registerValidation } from '../middleware/validation';

const router = Router();

router.post('/login', loginLimiter, loginValidation, authController.login);
router.post('/register', loginLimiter, registerValidation, authController.register);
router.post('/logout', authenticate, authController.logout);
router.get('/session', authenticate, authController.getSession);
router.post('/refresh', authController.refreshToken);

export default router;
