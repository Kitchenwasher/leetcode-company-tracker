import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, AuthController.register);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/google', authRateLimiter, AuthController.googleAuth);
router.post('/github', authRateLimiter, AuthController.githubAuth);
router.get('/oauth-config', AuthController.getOAuthConfig);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.get('/me', authenticateToken, AuthController.getMe);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);

export default router;
