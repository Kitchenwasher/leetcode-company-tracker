import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { CreateMockSessionInput } from '../types/mock.js';

export class MockController {
  /**
   * GET /api/mock/sessions
   * Retrieves all mock interview sessions and aggregated analytics for authenticated user
   */
  static async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const sessions = await prisma.mockInterviewSession.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = sessions.map((s) => {
        let parsedQuestions = [];
        try {
          parsedQuestions = JSON.parse(s.questionsData);
        } catch {
          parsedQuestions = [];
        }

        const dateStr = s.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        return {
          id: s.id,
          userId: s.userId,
          company: s.company,
          role: s.role,
          type: s.type,
          difficulty: s.difficulty,
          score: s.score,
          durationMinutes: s.durationMinutes,
          solvedCount: s.solvedCount,
          totalQuestions: s.totalQuestions,
          feedback: s.feedback,
          questionsData: parsedQuestions,
          date: dateStr,
          timestamp: s.createdAt.getTime(),
          createdAt: s.createdAt.toISOString(),
        };
      });

      // Compute aggregate analytics
      const totalSessions = formatted.length;
      const completedSessions = formatted.filter((s) => s.solvedCount > 0 || s.score >= 50).length;
      const avgScore = totalSessions > 0
        ? Math.round(formatted.reduce((acc, s) => acc + s.score, 0) / totalSessions)
        : null;
      const totalMinutes = formatted.reduce((acc, s) => acc + s.durationMinutes, 0);
      const totalSolved = formatted.reduce((acc, s) => acc + s.solvedCount, 0);
      const avgSpeed = totalSolved > 0 ? (totalMinutes / totalSolved).toFixed(1) : null;

      res.json({
        sessions: formatted,
        stats: {
          totalSessions,
          completedSessions,
          avgScore,
          totalMinutes,
          avgSpeed,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/mock/sessions
   * Records a completed mock interview session
   */
  static async recordSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        company,
        role = 'SWE Candidate',
        type = 'Coding',
        difficulty,
        score = 0,
        durationMinutes = 1,
        solvedCount = 0,
        totalQuestions = 1,
        feedback,
        questionsData = [],
      }: CreateMockSessionInput = req.body;

      if (!company) {
        res.status(400).json({ error: 'Target company is required.' });
        return;
      }

      const session = await prisma.mockInterviewSession.create({
        data: {
          userId: req.user.id,
          company: company.trim(),
          role: role.trim(),
          type,
          difficulty: difficulty || 'Medium',
          score: Math.min(100, Math.max(0, Math.round(score))),
          durationMinutes: Math.max(1, durationMinutes),
          solvedCount: Math.max(0, solvedCount),
          totalQuestions: Math.max(1, totalQuestions),
          feedback: feedback || null,
          questionsData: JSON.stringify(questionsData),
        },
      });

      const dateStr = session.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      res.status(201).json({
        id: session.id,
        userId: session.userId,
        company: session.company,
        role: session.role,
        type: session.type,
        difficulty: session.difficulty,
        score: session.score,
        durationMinutes: session.durationMinutes,
        solvedCount: session.solvedCount,
        totalQuestions: session.totalQuestions,
        feedback: session.feedback,
        questionsData,
        date: dateStr,
        timestamp: session.createdAt.getTime(),
        createdAt: session.createdAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
