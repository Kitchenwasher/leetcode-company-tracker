import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/plans', PaymentController.getPlans);
router.post('/create-checkout-session', authenticateToken, PaymentController.createCheckoutSession);
router.post('/create-portal-session', authenticateToken, PaymentController.createPortalSession);
router.get('/status', authenticateToken, PaymentController.getSubscriptionStatus);
router.post('/bmc-verify', authenticateToken, PaymentController.verifyBMCPayment);

export default router;
