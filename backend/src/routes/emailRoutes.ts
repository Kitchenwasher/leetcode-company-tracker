import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/test', EmailController.sendTestEmail);
router.post('/resend-verification', authenticateToken, EmailController.resendVerification);

export default router;
