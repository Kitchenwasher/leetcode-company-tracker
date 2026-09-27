import { Router } from 'express';
import { MockController } from '../controllers/mockController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/sessions', authenticateToken, MockController.getSessions);
router.post('/sessions', authenticateToken, MockController.recordSession);

export default router;
