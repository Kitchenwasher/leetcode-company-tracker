import { Router } from 'express';
import { ProgressController } from '../controllers/progressController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All progress routes require authentication
router.use(authenticateToken);

router.get('/', ProgressController.getProgress);
router.put('/:questionId', ProgressController.updateQuestionProgress);
router.post('/batch', ProgressController.batchUpdateProgress);
router.get('/stats/summary', ProgressController.getStats);

export default router;
