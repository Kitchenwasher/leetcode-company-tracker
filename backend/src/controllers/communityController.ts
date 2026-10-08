import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { CreatePostInput } from '../types/community.js';
import { cache } from '../utils/cache.js';

export class CommunityController {
  /**
   * Helper to resolve or create a community guest user when a request is unauthenticated
   */
  private static async getOrCreateGuestUser(authorName?: string): Promise<{ id: string; name: string; tier: string; avatarUrl: string | null }> {
    const email = 'community-guest@cheatcode.in';
    let guest = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, tier: true, avatarUrl: true },
    });

    if (!guest) {
      guest = await prisma.user.create({
        data: {
          email,
          name: authorName?.trim() || 'Community Engineer',
          tier: 'free',
          targetCompany: 'google',
        },
        select: { id: true, name: true, tier: true, avatarUrl: true },
      });
    } else if (authorName?.trim() && guest.name !== authorName.trim()) {
      guest = await prisma.user.update({
        where: { id: guest.id },
        data: { name: authorName.trim() },
        select: { id: true, name: true, tier: true, avatarUrl: true },
      });
    }

    return guest;
  }

  static async getCommunityStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [userCount, solvedCount, postCount] = await Promise.all([
        prisma.user.count(),
        prisma.userProgress.count({
          where: {
            status: { in: ['solved', 'mastered'] },
          },
        }),
        prisma.communityPost.count(),
      ]);

      const result = {
        activeEngineers: userCount,
        solutionsSolved: solvedCount,
        companiesIndexed: 659,
        verifiedQuestions: 3399,
        communityPosts: postCount,
      };

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getLeaderboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: {
          email: { not: 'community-guest@cheatcode.in' },
        },
        take: 50,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          tier: true,
          progress: {
            where: {
              status: { in: ['solved', 'mastered'] },
            },
            select: {
              questionId: true,
            },
          },
          activities: {
            where: {
              solveCount: { gt: 0 },
            },
            select: {
              date: true,
            },
          },
        },
      });

      const mapped = users.map((u) => {
        const solvedCount = u.progress.length;
        const activeDaysCount = u.activities.length;
        let badge = 'Novice';
        if (solvedCount >= 100) badge = 'Grandmaster';
        else if (solvedCount >= 50) badge = 'Master';
        else if (solvedCount >= 20) badge = 'Expert';
        else if (solvedCount >= 5) badge = 'Specialist';

        return {
          id: u.id,
          name: u.name,
          avatarUrl: u.avatarUrl,
          solved: solvedCount,
          streak: Math.max(activeDaysCount, 1),
          badge,
          tier: u.tier,
        };
      });

      mapped.sort((a, b) => b.solved - a.solved);

      const ranked = mapped.slice(0, 10).map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

      const finalLeaderboard = ranked.length > 0 ? ranked : [
        { id: 'leader-1', name: 'Abhinav sharma', avatarUrl: null, solved: 25, streak: 11, badge: 'Expert', tier: 'pro', rank: 1 },
        { id: 'leader-2', name: 'NikkiKush14', avatarUrl: null, solved: 10, streak: 9, badge: 'Specialist', tier: 'pro', rank: 2 },
        { id: 'leader-3', name: 'Bismeet Singh', avatarUrl: null, solved: 3, streak: 2, badge: 'Novice', tier: 'free', rank: 3 },
        { id: 'leader-4', name: 'Bruce wayne', avatarUrl: null, solved: 1, streak: 1, badge: 'Novice', tier: 'free', rank: 4 },
        { id: 'leader-5', name: 'Aditya_36', avatarUrl: null, solved: 1, streak: 1, badge: 'Novice', tier: 'free', rank: 5 },
      ];

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(finalLeaderboard);
    } catch (err) {
      next(err);
    }
  }

  static async getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, company, search, sortBy = 'hot', page = '1', limit = '20' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (category && category !== 'all') {
        where.category = String(category);
      }
      if (company && company !== 'all') {
        if (company === 'general') {
          where.OR = [
            { companyId: null },
            { companyId: '' },
            { companyId: 'general' },
          ];
        } else {
          where.companyId = String(company).toLowerCase();
        }
      }
      if (search) {
        const q = String(search).trim();
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
          { tags: { contains: q, mode: 'insensitive' } },
        ];
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'top' || sortBy === 'hot') {
        orderBy = [{ upvotesCount: 'desc' }, { createdAt: 'desc' }];
      } else if (sortBy === 'newest') {
        orderBy = { createdAt: 'desc' };
      }

      const [total, rawPosts] = await Promise.all([
        prisma.communityPost.count({ where }),
        prisma.communityPost.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                tier: true,
              },
            },
            _count: {
              select: {
                comments: true,
                upvotes: true,
              },
            },
            ...(req.user
              ? {
                  upvotes: {
                    where: { userId: req.user.id },
                    select: { userId: true },
                  },
                }
              : {}),
          },
          orderBy,
          skip,
          take: limitNum,
        }),
      ]);

      const formatted = rawPosts.map((p: any) => {
        let parsedTags: string[] = [];
        try {
          parsedTags = JSON.parse(p.tags);
        } catch {
          parsedTags = [];
        }

        const hasUpvoted = Boolean(p.upvotes && p.upvotes.length > 0);

        return {
          id: p.id,
          userId: p.userId,
          authorName: p.user?.name || 'Community Engineer',
          authorAvatar: p.user?.avatarUrl || null,
          authorTier: p.user?.tier || 'free',
          title: p.title,
          content: p.content,
          category: p.category,
          companyId: p.companyId,
          questionId: p.questionId,
          tags: parsedTags,
          upvotesCount: p.upvotesCount,
          commentsCount: p._count?.comments || 0,
          hasUpvoted,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      });

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json({
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        posts: formatted,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPostById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);

      const post = await prisma.communityPost.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, tier: true },
          },
          comments: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true, tier: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          ...(req.user
            ? {
                upvotes: {
                  where: { userId: req.user.id },
                  select: { userId: true },
                },
              }
            : {}),
        },
      });

      if (!post) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      let parsedTags: string[] = [];
      try {
        parsedTags = JSON.parse(post.tags);
      } catch {
        parsedTags = [];
      }

      const hasUpvoted = Boolean(post.upvotes && post.upvotes.length > 0);

      const comments = (post.comments || []).map((c: any) => ({
        id: c.id,
        postId: c.postId,
        userId: c.userId,
        authorName: c.user?.name || 'Community Engineer',
        authorAvatar: c.user?.avatarUrl || null,
        authorTier: c.user?.tier || 'free',
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      }));

      const postData = {
        id: post.id,
        userId: post.userId,
        authorName: post.user?.name || 'Community Engineer',
        authorAvatar: post.user?.avatarUrl || null,
        authorTier: post.user?.tier || 'free',
        title: post.title,
        content: post.content,
        category: post.category,
        companyId: post.companyId,
        questionId: post.questionId,
        tags: parsedTags,
        upvotesCount: post.upvotesCount,
        commentsCount: comments.length,
        hasUpvoted,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        comments,
      };

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(postData);
    } catch (err) {
      next(err);
    }
  }

  static async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, content, category = 'general', companyId, questionId, tags }: CreatePostInput = req.body;

      if (!title || title.trim().length < 5) {
        res.status(400).json({ error: 'Title must be at least 5 characters long.' });
        return;
      }

      if (!content || content.trim().length < 10) {
        res.status(400).json({ error: 'Post content must be at least 10 characters long.' });
        return;
      }

      let userId: string;
      if (req.user) {
        userId = req.user.id;
      } else {
        const guest = await CommunityController.getOrCreateGuestUser(req.body.authorName);
        userId = guest.id;
      }

      const post: any = await prisma.communityPost.create({
        data: {
          userId,
          title: title.trim(),
          content: content.trim(),
          category,
          companyId: companyId ? companyId.trim().toLowerCase() : null,
          questionId: questionId ? Number(questionId) : null,
          tags: tags ? JSON.stringify(tags) : '[]',
          upvotesCount: 1, // Author automatic initial upvote
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, tier: true },
          },
        },
      });

      // Register initial author upvote
      await prisma.communityUpvote.create({
        data: {
          userId,
          postId: post.id,
        },
      }).catch(() => {});

      let parsedTags: string[] = [];
      try {
        parsedTags = JSON.parse(post.tags);
      } catch {
        parsedTags = [];
      }

      cache.delPrefix('community:');

      res.status(201).json({
        id: post.id,
        userId: post.userId,
        authorName: post.user.name,
        authorAvatar: post.user.avatarUrl,
        authorTier: post.user.tier,
        title: post.title,
        content: post.content,
        category: post.category,
        companyId: post.companyId,
        questionId: post.questionId,
        tags: parsedTags,
        upvotesCount: 1,
        commentsCount: 0,
        hasUpvoted: true,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { content } = req.body;

      if (!content || content.trim().length < 2) {
        res.status(400).json({ error: 'Comment must be at least 2 characters long.' });
        return;
      }

      const post = await prisma.communityPost.findUnique({ where: { id } });
      if (!post) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      let userId: string;
      if (req.user) {
        userId = req.user.id;
      } else {
        const guest = await CommunityController.getOrCreateGuestUser(req.body.authorName);
        userId = guest.id;
      }

      const comment: any = await prisma.communityComment.create({
        data: {
          postId: id,
          userId,
          content: content.trim(),
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, tier: true },
          },
        },
      });

      cache.delPrefix('community:');

      res.status(201).json({
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        authorName: comment.user.name,
        authorAvatar: comment.user.avatarUrl,
        authorTier: comment.user.tier,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async toggleUpvote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let userId: string;
      if (req.user) {
        userId = req.user.id;
      } else {
        const guest = await CommunityController.getOrCreateGuestUser();
        userId = guest.id;
      }

      const id = String(req.params.id);
      const existing = await prisma.communityUpvote.findUnique({
        where: {
          userId_postId: {
            userId,
            postId: id,
          },
        },
      });

      let upvoted = false;
      let post: any;

      if (existing) {
        // Remove upvote
        await prisma.communityUpvote.delete({
          where: {
            userId_postId: {
              userId,
              postId: id,
            },
          },
        });

        post = await prisma.communityPost.update({
          where: { id },
          data: { upvotesCount: { decrement: 1 } },
          select: { upvotesCount: true },
        });
        upvoted = false;
      } else {
        // Add upvote
        await prisma.communityUpvote.create({
          data: {
            userId,
            postId: id,
          },
        });

        post = await prisma.communityPost.update({
          where: { id },
          data: { upvotesCount: { increment: 1 } },
          select: { upvotesCount: true },
        });
        upvoted = true;
      }

      cache.delPrefix('community:');

      res.json({
        upvoted,
        upvotesCount: Math.max(0, post.upvotesCount),
      });
    } catch (err) {
      next(err);
    }
  }
}
