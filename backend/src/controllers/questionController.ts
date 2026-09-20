import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AiSolutionService } from '../services/aiSolutionService.js';

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
      const formatted = rawQuestions.map((q: any) => {
        let parsedTopics: string[] = [];
        try {
          parsedTopics = JSON.parse(q.topics);
        } catch {
          parsedTopics = [];
        }

        const compMap: Record<string, any> = {};
        q.companies.forEach((c: any) => {
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
        formatted.sort((a: any, b: any) => {
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
      question.companies.forEach((c: any) => {
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

      const forceRegenerate = req.query.regenerate === 'true';

      if (!forceRegenerate) {
        const solution = await prisma.solution.findUnique({
          where: { questionId: id },
        });

        if (solution) {
          res.json({
            questionId: solution.questionId,
            corePattern: solution.corePattern,
            interviewTips: JSON.parse(solution.interviewTips || '[]'),
            approaches: JSON.parse(solution.approaches || '[]'),
          });
          return;
        }
      }

      // Not cached or regeneration requested: Generate with Meta Muse AI
      const question = await prisma.question.findUnique({
        where: { id },
      });

      if (!question) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      let topics: string[] = [];
      try {
        topics = JSON.parse(question.topics);
      } catch {
        topics = [];
      }

      const aiSolution = await AiSolutionService.generateSolution({
        id: question.id,
        title: question.title,
        difficulty: question.difficulty,
        topics,
      });

      // Cache permanently in Neon PostgreSQL
      await prisma.solution.upsert({
        where: { questionId: id },
        update: {
          corePattern: aiSolution.corePattern,
          interviewTips: JSON.stringify(aiSolution.interviewTips),
          approaches: JSON.stringify(aiSolution.approaches),
        },
        create: {
          questionId: id,
          corePattern: aiSolution.corePattern,
          interviewTips: JSON.stringify(aiSolution.interviewTips),
          approaches: JSON.stringify(aiSolution.approaches),
        },
      });

      res.json(aiSolution);
    } catch (err) {
      next(err);
    }
  }

  static async generateAiSolution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid question ID' });
        return;
      }

      const question = await prisma.question.findUnique({
        where: { id },
      });

      if (!question) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      let topics: string[] = [];
      try {
        topics = JSON.parse(question.topics);
      } catch {
        topics = [];
      }

      const aiSolution = await AiSolutionService.generateSolution({
        id: question.id,
        title: question.title,
        difficulty: question.difficulty,
        topics,
      });

      await prisma.solution.upsert({
        where: { questionId: id },
        update: {
          corePattern: aiSolution.corePattern,
          interviewTips: JSON.stringify(aiSolution.interviewTips),
          approaches: JSON.stringify(aiSolution.approaches),
        },
        create: {
          questionId: id,
          corePattern: aiSolution.corePattern,
          interviewTips: JSON.stringify(aiSolution.interviewTips),
          approaches: JSON.stringify(aiSolution.approaches),
        },
      });

      res.json(aiSolution);
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
      companyStats.forEach((c: any) => {
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

  static async getDescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid question ID' });
        return;
      }

      const question = await prisma.question.findUnique({
        where: { id },
        include: {
          solution: true,
        },
      });

      if (!question) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      // Determine slug from URL or title
      let slug = '';
      if (question.url) {
        const parts = question.url.replace(/\/+$/, '').split('/');
        const last = parts[parts.length - 1];
        if (last && last !== 'problems') slug = last;
      }
      if (!slug) {
        slug = question.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      let parsedTopics: string[] = [];
      try {
        parsedTopics = JSON.parse(question.topics);
      } catch {
        parsedTopics = [];
      }

      // 1. Check if already cached permanently in PostgreSQL Neon Database
      if (question.descriptionContent && question.codeSnippets) {
        let cachedTestcases: string[] = [];
        let cachedSnippets: any[] = [];
        try {
          cachedTestcases = question.exampleTestcases ? JSON.parse(question.exampleTestcases) : [];
        } catch {
          cachedTestcases = [];
        }
        try {
          cachedSnippets = question.codeSnippets ? JSON.parse(question.codeSnippets) : [];
        } catch {
          cachedSnippets = [];
        }

        // Return cached data immediately without any network calls to LeetCode
        res.json({
          id: question.id,
          title: question.title,
          titleSlug: slug,
          difficulty: question.difficulty,
          content: question.descriptionContent,
          exampleTestcases: cachedTestcases,
          topicTags: parsedTopics,
          codeSnippets: cachedSnippets,
          cached: true,
        });
        return;
      }

      // 2. Not cached in DB yet: Fetch once from LeetCode GraphQL
      let detail: any = null;
      try {
        const gqlRes = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://leetcode.com',
            'Origin': 'https://leetcode.com',
          },
          body: JSON.stringify({
            query: `query questionData($titleSlug: String!) {
              question(titleSlug: $titleSlug) {
                questionId
                title
                content
                difficulty
                exampleTestcaseList
                topicTags { name }
                codeSnippets {
                  lang
                  langSlug
                  code
                }
              }
            }`,
            variables: { titleSlug: slug },
          }),
        });

        if (gqlRes.ok) {
          const gqlData = (await gqlRes.json()) as any;
          detail = gqlData?.data?.question;
        }
      } catch (fetchErr) {
        console.warn(`[LeetCode GraphQL] Fetch failed for slug '${slug}':`, fetchErr);
      }

      // 3. If fetched successfully, persist permanently into database
      if (detail && detail.content) {
        const snippets = detail.codeSnippets || [];
        const testcases = detail.exampleTestcaseList || [];
        const tags = detail.topicTags?.map((t: any) => t.name) || parsedTopics;

        try {
          await prisma.question.update({
            where: { id: question.id },
            data: {
              descriptionContent: detail.content,
              exampleTestcases: JSON.stringify(testcases),
              codeSnippets: JSON.stringify(snippets),
            },
          });
        } catch (dbErr) {
          console.error(`[DB Cache] Failed to cache question #${question.id} in DB:`, dbErr);
        }

        res.json({
          id: question.id,
          title: question.title,
          titleSlug: slug,
          difficulty: question.difficulty,
          content: detail.content,
          exampleTestcases: testcases,
          topicTags: tags,
          codeSnippets: snippets,
          cached: false,
        });
        return;
      }

      // 4. Fallback if LeetCode GraphQL is blocked/down: extract snippets from solution if available
      let fallbackSnippets: any[] = [];
      if (question.solution?.approaches) {
        try {
          const approaches = JSON.parse(question.solution.approaches);
          const firstApp = approaches[0];
          if (firstApp?.code) {
            if (firstApp.code.cpp) {
              fallbackSnippets.push({ lang: 'C++', langSlug: 'cpp', code: firstApp.code.cpp });
            }
            if (firstApp.code.python) {
              fallbackSnippets.push({ lang: 'Python3', langSlug: 'python3', code: firstApp.code.python });
            }
            if (firstApp.code.java) {
              fallbackSnippets.push({ lang: 'Java', langSlug: 'java', code: firstApp.code.java });
            }
          }
        } catch {}
      }

      res.json({
        id: question.id,
        title: question.title,
        titleSlug: slug,
        difficulty: question.difficulty,
        content: question.descriptionContent || '<p>Problem description is loading or temporarily unavailable from LeetCode.</p>',
        exampleTestcases: [],
        topicTags: parsedTopics,
        codeSnippets: fallbackSnippets,
        cached: false,
      });
    } catch (err) {
      next(err);
    }
  }
}
