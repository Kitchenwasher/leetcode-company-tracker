import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AiSolutionService } from '../services/aiSolutionService.js';
import { cache } from '../utils/cache.js';
import { questionDataService } from '../services/questionDataService.js';

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
        const meta = questionDataService.getQuestionMeta(id);
        if (!meta) {
          res.status(404).json({ error: 'Question not found' });
          return;
        }

        res.json({
          id: meta.id,
          title: meta.title,
          difficulty: meta.difficulty,
          acceptance: meta.acceptance,
          url: meta.url,
          topics: meta.topics || [],
          isBlind75: !!meta.isBlind75,
          isNeetCode150: !!meta.isNeetCode150,
          isStriver180: !!meta.isStriver180,
          isGrind169: !!meta.isGrind169,
          companies: meta.companies || {},
          userProgress: null,
        });
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
        const cached = cache.get<any>(`question:solution:${id}`);
        if (cached) {
          res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
          res.json(cached);
          return;
        }

        const solution = await prisma.solution.findUnique({
          where: { questionId: id },
        });

        const isPlaceholder = Boolean(
          solution &&
          (solution.corePattern === 'State Invariant & Mathematical Reduction' ||
            !solution.approaches ||
            solution.approaches.includes('nums = [2, 1, -3, 4]') ||
            solution.approaches.includes('solveNaive') ||
            solution.approaches.includes('solveOptimal'))
        );

        if (solution && !isPlaceholder) {
          const formatted = {
            questionId: solution.questionId,
            corePattern: solution.corePattern,
            interviewTips: JSON.parse(solution.interviewTips || '[]'),
            approaches: JSON.parse(solution.approaches || '[]'),
          };
          cache.set(`question:solution:${id}`, formatted, 3600);
          res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
          res.json(formatted);
          return;
        }
      }

      let question = await prisma.question.findUnique({
        where: { id },
      });

      if (!question) {
        const meta = questionDataService.getQuestionMeta(id);
        if (meta) {
          question = await prisma.question.upsert({
            where: { id },
            update: {},
            create: {
              id: meta.id,
              title: meta.title,
              difficulty: meta.difficulty,
              acceptance: meta.acceptance,
              url: meta.url,
              topics: JSON.stringify(meta.topics || []),
              isBlind75: !!meta.isBlind75,
              isNeetCode150: !!meta.isNeetCode150,
              isStriver180: !!meta.isStriver180,
              isGrind169: !!meta.isGrind169,
            },
          });
        }
      }

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

      cache.set(`question:solution:${id}`, aiSolution, 3600);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
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

      let question = await prisma.question.findUnique({
        where: { id },
      });

      if (!question) {
        const meta = questionDataService.getQuestionMeta(id);
        if (meta) {
          question = await prisma.question.upsert({
            where: { id },
            update: {},
            create: {
              id: meta.id,
              title: meta.title,
              difficulty: meta.difficulty,
              acceptance: meta.acceptance,
              url: meta.url,
              topics: JSON.stringify(meta.topics || []),
              isBlind75: !!meta.isBlind75,
              isNeetCode150: !!meta.isNeetCode150,
              isStriver180: !!meta.isStriver180,
              isGrind169: !!meta.isGrind169,
            },
          });
        }
      }

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

      cache.set(`question:solution:${id}`, aiSolution, 3600);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
      res.json(aiSolution);
    } catch (err) {
      next(err);
    }
  }

  static async getCompanies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cached = cache.get<Record<string, { totalQuestions: number; thirtyDaysCount: number }>>('questions:companies');
      if (cached) {
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
        res.json(cached);
        return;
      }

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

      cache.set('questions:companies', result, 3600);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
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

      // Check fast in-memory cache
      const cachedDesc = cache.get<any>(`question:desc:${id}`);
      if (cachedDesc && cachedDesc.content) {
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
        res.json(cachedDesc);
        return;
      }

      // Query params passed by client
      const clientTitle = (req.query.title as string) || '';
      const clientSlug = (req.query.titleSlug as string) || '';
      const clientDifficulty = (req.query.difficulty as string) || '';
      const clientUrl = (req.query.url as string) || '';

      // 1. Check if already stored in PostgreSQL Neon Database with full description
      let question = await prisma.question.findUnique({
        where: { id },
        include: {
          solution: true,
        },
      });

      if (question && question.descriptionContent && question.codeSnippets) {
        let cachedTestcases: string[] = [];
        let cachedSnippets: any[] = [];
        try {
          cachedTestcases = question.exampleTestcases ? JSON.parse(question.exampleTestcases) : [];
        } catch {}
        try {
          cachedSnippets = question.codeSnippets ? JSON.parse(question.codeSnippets) : [];
        } catch {}

        let parsedTopics: string[] = [];
        try {
          parsedTopics = JSON.parse(question.topics);
        } catch {}

        const slug = clientSlug || questionDataService.resolveSlug(id, question.url, question.title);

        const payload = {
          id: question.id,
          title: question.title,
          titleSlug: slug,
          difficulty: question.difficulty,
          content: question.descriptionContent,
          exampleTestcases: cachedTestcases,
          topicTags: parsedTopics,
          codeSnippets: cachedSnippets,
          cached: true,
        };
        cache.set(`question:desc:${id}`, payload, 3600);
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
        res.json(payload);
        return;
      }

      // 2. Resolve metadata from bundled dataset or query params if not in DB
      const meta = questionDataService.getQuestionMeta(id);
      const title = question?.title || clientTitle || meta?.title || `Problem ${id}`;
      const difficulty = question?.difficulty || clientDifficulty || meta?.difficulty || 'Medium';
      const url = question?.url || clientUrl || meta?.url || '';
      const slug = clientSlug || questionDataService.resolveSlug(id, url, title);

      let parsedTopics: string[] = [];
      if (question?.topics) {
        try { parsedTopics = JSON.parse(question.topics); } catch {}
      } else if (meta?.topics) {
        parsedTopics = meta.topics;
      }

      if (!slug) {
        res.status(404).json({ error: 'Question slug could not be determined' });
        return;
      }

      // 3. Fetch on-demand from LeetCode GraphQL (or curated repository for locked questions)
      let detail = await questionDataService.fetchLeetCodeGraphQL(slug);

      if (!detail || !detail.content) {
        const curated = await AiSolutionService.fetchCuratedDescription(id, title);
        if (curated && curated.content) {
          detail = {
            title,
            difficulty,
            content: curated.content,
            exampleTestcaseList: curated.exampleTestcases || [],
            topicTags: parsedTopics.map((t) => ({ name: t })),
            codeSnippets: [],
          };
        }
      }

      if (detail && detail.content) {
        const snippets = detail.codeSnippets || [];
        const testcases = detail.exampleTestcaseList || [];
        const tags = detail.topicTags?.map((t: any) => t.name) || parsedTopics;

        // Persist permanently into PostgreSQL Neon DB so subsequent requests never hit LeetCode again
        try {
          await prisma.question.upsert({
            where: { id },
            update: {
              descriptionContent: detail.content,
              exampleTestcases: JSON.stringify(testcases),
              codeSnippets: JSON.stringify(snippets),
            },
            create: {
              id,
              title: detail.title || title,
              difficulty: detail.difficulty || difficulty,
              acceptance: meta?.acceptance || '50.0%',
              url: url || `https://leetcode.com/problems/${slug}`,
              topics: JSON.stringify(tags),
              isBlind75: !!meta?.isBlind75,
              isGrind169: !!meta?.isGrind169,
              isNeetCode150: !!meta?.isNeetCode150,
              isStriver180: !!meta?.isStriver180,
              descriptionContent: detail.content,
              exampleTestcases: JSON.stringify(testcases),
              codeSnippets: JSON.stringify(snippets),
            },
          });
          console.log(`[DB Cache] Successfully cached question #${id} (${slug}) in Neon DB`);
        } catch (dbErr) {
          console.error(`[DB Cache] Failed to cache question #${id} in DB:`, dbErr);
        }

        const fetchedPayload = {
          id,
          title: detail.title || title,
          titleSlug: slug,
          difficulty: detail.difficulty || difficulty,
          content: detail.content,
          exampleTestcases: testcases,
          topicTags: tags,
          codeSnippets: snippets,
          cached: false,
        };
        cache.set(`question:desc:${id}`, fetchedPayload, 3600);
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
        res.json(fetchedPayload);
        return;
      }

      // 4. Fallback if LeetCode GraphQL is temporarily unreachable: extract snippets from solution if available
      let fallbackSnippets: any[] = [];
      if (question?.solution?.approaches) {
        try {
          const approaches = JSON.parse(question.solution.approaches);
          const firstApp = approaches[0];
          if (firstApp?.code) {
            if (firstApp.code.cpp) fallbackSnippets.push({ lang: 'C++', langSlug: 'cpp', code: firstApp.code.cpp });
            if (firstApp.code.python) fallbackSnippets.push({ lang: 'Python3', langSlug: 'python3', code: firstApp.code.python });
            if (firstApp.code.java) fallbackSnippets.push({ lang: 'Java', langSlug: 'java', code: firstApp.code.java });
          }
        } catch {}
      }

      res.json({
        id,
        title,
        titleSlug: slug,
        difficulty,
        content: question?.descriptionContent || null,
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
