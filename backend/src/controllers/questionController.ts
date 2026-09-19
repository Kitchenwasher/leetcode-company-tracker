import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

export class QuestionController {
  static async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        company = 'google',
        timeframe = 'thirty-days',
        difficulty,
        topic,
        search,
        track,
        page = '1',
        limit = '50',
        sortBy = 'frequency',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      // Base filters
      const where: any = {};

      // Filter by company
      if (company && company !== 'all') {
        where.companies = {
          some: {
            companyId: String(company),
            ...(timeframe === 'thirty-days' ? { thirtyDaysFreq: { not: null } } : {}),
            ...(timeframe === 'three-months' ? { threeMonthsFreq: { not: null } } : {}),
            ...(timeframe === 'six-months' ? { sixMonthsFreq: { not: null } } : {}),
            ...(timeframe === 'two-years' ? { twoYearsFreq: { not: null } } : {}),
          },
        };
      }

      // Filter by difficulty
      if (difficulty && difficulty !== 'all') {
        where.difficulty = String(difficulty);
      }

      // Filter by curated track
      if (track === 'blind75') where.isBlind75 = true;
      if (track === 'neetcode150') where.isNeetCode150 = true;
      if (track === 'striver180') where.isStriver180 = true;
      if (track === 'grind169') where.isGrind169 = true;

      // Filter by topic
      if (topic && topic !== 'all') {
        where.topics = { contains: String(topic) };
      }

      // Filter by search query
      if (search) {
        const q = String(search).trim();
        if (/^\d+$/.test(q)) {
          where.OR = [
            { id: parseInt(q, 10) },
            { title: { contains: q } },
          ];
        } else {
          where.title = { contains: q };
        }
      }

      const total = await prisma.question.count({ where });

      // Fetch questions with company metadata
      const rawQuestions = await prisma.question.findMany({
        where,
        include: {
          companies: {
            where: company && company !== 'all' ? { companyId: String(company) } : undefined,
          },
          ...(req.user ? {
            userProgress: {
              where: { userId: req.user.id },
              select: {
                status: true,
                isFavorite: true,
                confidence: true,
                notes: true,
                tags: true,
              },
            },
          } : {}),
        },
        skip,
        take: limitNum,
      });

      // Parse JSON topics & format
      const formatted = rawQuestions.map((q) => {
        let parsedTopics: string[] = [];
        try {
          parsedTopics = JSON.parse(q.topics);
        } catch {
          parsedTopics = [];
        }

        const compMap: Record<string, any> = {};
        q.companies.forEach((c) => {
          compMap[c.companyId] = {
            all: c.allFreq || '0.0%',
            'thirty-days': c.thirtyDaysFreq,
            'three-months': c.threeMonthsFreq,
            'six-months': c.sixMonthsFreq,
            'two-years': c.twoYearsFreq,
          };
        });

        const userProg = (q as any).userProgress?.[0];

        return {
          id: q.id,
          title: q.title,
          difficulty: q.difficulty,
          acceptance: q.acceptance,
          url: q.url,
          topics: parsedTopics,
          isBlind75: q.isBlind75,
          isNeetCode150: q.isNeetCode150,
          isStriver180: q.isStriver180,
          isGrind169: q.isGrind169,
          companies: compMap,
          userStatus: userProg?.status || 'todo',
          isFavorite: !!userProg?.isFavorite,
          confidence: userProg?.confidence || 0,
        };
      });

      // Sort in memory by frequency if specified
      if (sortBy === 'frequency') {
        formatted.sort((a, b) => {
          const fa = parseFloat(a.companies[String(company)]?.['thirty-days']?.replace('%', '') || a.companies[String(company)]?.all?.replace('%', '') || '0');
          const fb = parseFloat(b.companies[String(company)]?.['thirty-days']?.replace('%', '') || b.companies[String(company)]?.all?.replace('%', '') || '0');
          return sortOrder === 'desc' ? fb - fa : fa - fb;
        });
      }

      res.json({
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        questions: formatted,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getQuestionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid question ID' });
        return;
      }

      const question = await prisma.question.findUnique({
        where: { id },
        include: {
          companies: true,
          ...(req.user ? {
            userProgress: {
              where: { userId: req.user.id },
            },
          } : {}),
        },
      });

      if (!question) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      const compMap: Record<string, any> = {};
      question.companies.forEach((c) => {
        compMap[c.companyId] = {
          all: c.allFreq || '0.0%',
          'thirty-days': c.thirtyDaysFreq,
          'three-months': c.threeMonthsFreq,
          'six-months': c.sixMonthsFreq,
          'two-years': c.twoYearsFreq,
        };
      });

      let parsedTopics: string[] = [];
      try {
        parsedTopics = JSON.parse(question.topics);
      } catch {}

      res.json({
        id: question.id,
        title: question.title,
        difficulty: question.difficulty,
        acceptance: question.acceptance,
        url: question.url,
        topics: parsedTopics,
        isBlind75: question.isBlind75,
        isNeetCode150: question.isNeetCode150,
        isStriver180: question.isStriver180,
        isGrind169: question.isGrind169,
        companies: compMap,
        userProgress: (question as any).userProgress?.[0] || null,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSolution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid question ID' });
        return;
      }

      const solution = await prisma.solution.findUnique({
        where: { questionId: id },
      });

      if (!solution) {
        res.status(404).json({ error: 'Solution not available for this problem' });
        return;
      }

      res.json({
        questionId: solution.questionId,
        corePattern: solution.corePattern,
        interviewTips: JSON.parse(solution.interviewTips || '[]'),
        approaches: JSON.parse(solution.approaches || '[]'),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCompanies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Group by companyId and count questions
      const companyStats = await prisma.questionCompany.groupBy({
        by: ['companyId'],
        _count: {
          questionId: true,
        },
      });

      const result: Record<string, { totalQuestions: number; thirtyDaysCount: number }> = {};
      companyStats.forEach((c) => {
        result[c.companyId] = {
          totalQuestions: c._count.questionId,
          thirtyDaysCount: 0, // updated dynamically
        };
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
