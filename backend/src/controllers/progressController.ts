import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

const getTodayKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export class ProgressController {
  static async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const progressList = await prisma.userProgress.findMany({
        where: { userId: req.user.id },
      });

      const progressMap: Record<string, any> = {};
      progressList.forEach((p) => {
        let parsedTags: string[] = [];
        try {
          parsedTags = p.tags ? JSON.parse(p.tags) : [];
        } catch {}

        let parsedSnippet = null;
        try {
          parsedSnippet = p.codeSnippet ? JSON.parse(p.codeSnippet) : null;
        } catch {}

        progressMap[String(p.questionId)] = {
          questionId: p.questionId,
          status: p.status,
          isFavorite: p.isFavorite,
          confidence: p.confidence,
          personalDifficulty: p.personalDifficulty,
          notes: p.notes,
          tags: parsedTags,
          timeSpentSeconds: p.timeSpentSeconds,
          solveCount: p.solveCount,
          lastSolvedAt: p.lastSolvedAt,
          nextReviewAt: p.nextReviewAt,
          reviewIntervalDays: p.reviewIntervalDays,
          whiteboardData: p.whiteboardData,
          codeSnippet: parsedSnippet,
        };
      });

      res.json(progressMap);
    } catch (err) {
      next(err);
    }
  }

  static async updateQuestionProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const qId = parseInt(String(req.params.questionId), 10);
      if (isNaN(qId)) {
        res.status(400).json({ error: 'Invalid question ID' });
        return;
      }

      const {
        status,
        isFavorite,
        confidence,
        personalDifficulty,
        notes,
        tags,
        timeSpentSeconds,
        solveCount,
        nextReviewAt,
        reviewIntervalDays,
        whiteboardData,
        codeSnippet,
      } = req.body;

      const existing = await prisma.userProgress.findUnique({
        where: {
          userId_questionId: {
            userId: req.user.id,
            questionId: qId,
          },
        },
      });

      const isNowSolved = status === 'solved' || status === 'mastered';
      const wasAlreadySolved = existing?.status === 'solved' || existing?.status === 'mastered';

      // Update activity log if just solved
      if (isNowSolved && !wasAlreadySolved) {
        const today = getTodayKey();
        await prisma.activityLog.upsert({
          where: {
            userId_date: {
              userId: req.user.id,
              date: today,
            },
          },
          create: {
            userId: req.user.id,
            date: today,
            solveCount: 1,
          },
          update: {
            solveCount: { increment: 1 },
          },
        });
      }

      const updated = await prisma.userProgress.upsert({
        where: {
          userId_questionId: {
            userId: req.user.id,
            questionId: qId,
          },
        },
        create: {
          userId: req.user.id,
          questionId: qId,
          status: status || 'todo',
          isFavorite: isFavorite !== undefined ? isFavorite : false,
          confidence: confidence !== undefined ? confidence : 0,
          personalDifficulty,
          notes,
          tags: tags ? JSON.stringify(tags) : undefined,
          timeSpentSeconds: timeSpentSeconds || 0,
          solveCount: isNowSolved ? 1 : 0,
          lastSolvedAt: isNowSolved ? new Date() : undefined,
          nextReviewAt: nextReviewAt ? new Date(nextReviewAt) : undefined,
          reviewIntervalDays: reviewIntervalDays || 1,
          whiteboardData,
          codeSnippet: codeSnippet ? JSON.stringify(codeSnippet) : undefined,
        },
        update: {
          status: status !== undefined ? status : undefined,
          isFavorite: isFavorite !== undefined ? isFavorite : undefined,
          confidence: confidence !== undefined ? confidence : undefined,
          personalDifficulty: personalDifficulty !== undefined ? personalDifficulty : undefined,
          notes: notes !== undefined ? notes : undefined,
          tags: tags ? JSON.stringify(tags) : undefined,
          timeSpentSeconds: timeSpentSeconds !== undefined ? timeSpentSeconds : undefined,
          solveCount: solveCount !== undefined ? solveCount : isNowSolved && !wasAlreadySolved ? { increment: 1 } : undefined,
          lastSolvedAt: isNowSolved && !wasAlreadySolved ? new Date() : undefined,
          nextReviewAt: nextReviewAt ? new Date(nextReviewAt) : undefined,
          reviewIntervalDays: reviewIntervalDays !== undefined ? reviewIntervalDays : undefined,
          whiteboardData: whiteboardData !== undefined ? whiteboardData : undefined,
          codeSnippet: codeSnippet ? JSON.stringify(codeSnippet) : undefined,
        },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async batchUpdateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { questionIds, status = 'solved' } = req.body;
      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        res.status(400).json({ error: 'questionIds array is required' });
        return;
      }

      const now = new Date();
      let updatedCount = 0;

      for (const qid of questionIds) {
        const idNum = parseInt(String(qid), 10);
        if (isNaN(idNum)) continue;

        await prisma.userProgress.upsert({
          where: {
            userId_questionId: {
              userId: req.user.id,
              questionId: idNum,
            },
          },
          create: {
            userId: req.user.id,
            questionId: idNum,
            status,
            lastSolvedAt: now,
            solveCount: 1,
          },
          update: {
            status,
            lastSolvedAt: now,
          },
        });
        updatedCount++;
      }

      res.json({ message: `Successfully updated ${updatedCount} questions to ${status}.` });
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const progressList = await prisma.userProgress.findMany({
        where: { userId: req.user.id },
        include: { question: { select: { difficulty: true } } },
      });

      let totalSolved = 0;
      let easySolved = 0;
      let mediumSolved = 0;
      let hardSolved = 0;

      progressList.forEach((p) => {
        if (p.status === 'solved' || p.status === 'mastered') {
          totalSolved++;
          if (p.question.difficulty === 'Easy') easySolved++;
          else if (p.question.difficulty === 'Medium') mediumSolved++;
          else if (p.question.difficulty === 'Hard') hardSolved++;
        }
      });

      const activities = await prisma.activityLog.findMany({
        where: { userId: req.user.id },
        orderBy: { date: 'asc' },
      });

      const activityMap: Record<string, number> = {};
      activities.forEach((a) => {
        activityMap[a.date] = a.solveCount;
      });

      const today = getTodayKey();
      const todaySolved = activityMap[today] || 0;

      res.json({
        totalSolved,
        breakdown: {
          easy: easySolved,
          medium: mediumSolved,
          hard: hardSolved,
        },
        todaySolved,
        activityLog: activityMap,
      });
    } catch (err) {
      next(err);
    }
  }
}
