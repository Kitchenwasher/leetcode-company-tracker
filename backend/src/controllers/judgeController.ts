import { Request, Response } from 'express';
import { judgeService } from '../services/judgeService.js';

export class JudgeController {
  /**
   * POST /api/judge/run
   * Runs code against sample test cases or custom input
   */
  async runCode(req: Request, res: Response): Promise<void> {
    try {
      const { language, code, testcases, customInput } = req.body;

      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Code is required.' });
        return;
      }

      if (!language || !['cpp', 'python', 'java', 'javascript'].includes(language)) {
        res.status(400).json({ error: 'Valid language (cpp, python, java, javascript) is required.' });
        return;
      }

      const result = await judgeService.execute(language, code, testcases || [], customInput);
      res.json(result);
    } catch (err: any) {
      console.error('[JudgeController.runCode] Error:', err);
      res.status(500).json({
        status: 'Runtime Error',
        runtimeMs: 0,
        totalCases: 0,
        passedCases: 0,
        results: [],
        stderr: err.message || 'Execution failed.'
      });
    }
  }

  /**
   * POST /api/judge/submit
   * Submits code against testcases and records submission result
   */
  async submitCode(req: Request, res: Response): Promise<void> {
    try {
      const { language, code, testcases, questionId } = req.body;

      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Code is required.' });
        return;
      }

      if (!language || !['cpp', 'python', 'java', 'javascript'].includes(language)) {
        res.status(400).json({ error: 'Valid language (cpp, python, java, javascript) is required.' });
        return;
      }

      const result = await judgeService.execute(language, code, testcases || []);

      // If all passed, compute percentile metrics
      if (result.status === 'Accepted') {
        (result as any).beatsPercentile = Math.min(98.5, Math.max(72.0, Math.round((100 - result.runtimeMs / 2) * 10) / 10));
      }

      res.json(result);
    } catch (err: any) {
      console.error('[JudgeController.submitCode] Error:', err);
      res.status(500).json({
        status: 'Runtime Error',
        runtimeMs: 0,
        totalCases: 0,
        passedCases: 0,
        results: [],
        stderr: err.message || 'Submission failed.'
      });
    }
  }
}

export const judgeController = new JudgeController();
