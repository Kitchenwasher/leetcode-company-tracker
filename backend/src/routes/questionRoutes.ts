import { Router } from 'express';
import { QuestionController } from '../controllers/questionController.js';
import { optionalAuth, authenticateToken, requirePro } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, QuestionController.getQuestions);
router.get('/companies', QuestionController.getCompanies);
router.get('/:id', optionalAuth, QuestionController.getQuestionById);
router.get('/:id/description', QuestionController.getDescription);
router.get('/:id/solution', QuestionController.getSolution);
router.post('/:id/ai-solution', authenticateToken, requirePro, QuestionController.generateAiSolution);

export default router;
