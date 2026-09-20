import { Router } from 'express';
import { judgeController } from '../controllers/judgeController.js';

const router = Router();

router.post('/run', (req, res) => judgeController.runCode(req, res));
router.post('/submit', (req, res) => judgeController.submitCode(req, res));

export default router;
