import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { CreatePostInput } from '../types/community.js';

const INITIAL_SEEDED_POSTS = [
  {
    title: 'Google L4 Interview Loop (Mountain View) - Passed & Offer Received',
    content: `Sharing my recent experience interviewing for Google L4 (Software Engineer, Core Infrastructure):

**Round 1: Graph Traversal & Course Schedule II Variant**
- Problem: Detect cyclic dependencies in a distributed build tree with weighted edge costs.
- Approach: Topological sort using Kahn's algorithm (indegree counting), then memoized DFS to compute critical path latency.
- Interviewer focused heavily on clarifying input sizes ($V \le 10^5, E \le 5 \times 10^5$) and memory usage.

**Round 2: Distributed LRU Cache with TTL Eviction**
- Evaluated doubly linked list + hash map data structure with a min-heap tracking expiration timestamps.
- Key discussion was thread-safety and lock-free read concurrency.

**Round 3: String Parsing & Dynamic Programming**
- Wildcard matching variant with special quantifier tokens. Used $O(M \times N)$ 2D DP table with space optimization to $O(N)$.

**Round 4: Googleyness & Leadership**
- Questions about disagreeing with tech lead on refactoring timelines and handling a production sev-2 incident.
- Recommendation: Use structured STAR method with quantified results.`,
    category: 'interview_experience',
    companyId: 'google',
    tags: JSON.stringify(['Google', 'L4', 'Graphs', 'Topological Sort', 'System Design']),
    upvotesCount: 42,
  },
  {
    title: 'Meta E4 Full-Loop Breakdown (Menlo Park / Remote)',
    content: `Completed Meta E4 interview loop recently:

**Coding 1 (45 mins): 2 Questions**
1. Valid Parentheses with wildcard operators (similar to LeetCode #678).
2. Subarray Sum Equals K (LeetCode #560).
- Meta emphasizes speed and bug-free code. Had 10 minutes left to write edge test cases.

**Coding 2 (45 mins): 2 Questions**
1. Lowest Common Ancestor of a Binary Tree (LeetCode #236).
2. Vertical Order Traversal of a Binary Tree (LeetCode #314).
- Used BFS with column coordinate offset tracking.

**Behavioral:**
- Discussed working across teams to deprecate a legacy API under strict SLA requirements.`,
    category: 'interview_experience',
    companyId: 'meta',
    tags: JSON.stringify(['Meta', 'E4', 'Binary Tree', 'Prefix Sum', 'Speed']),
    upvotesCount: 38,
  },
  {
    title: 'Amazon SDE II Loop - Heavy focus on Leadership Principles & BFS',
    content: `Got an offer for Amazon SDE II (AWS DynamoDB team):

1. **Word Ladder II (LeetCode #126)**: BFS shortest path exploration followed by DFS backtracking for all minimal transformation paths.
2. **Modular File Search API**: Object-Oriented Design pattern with Filter/Specification pattern (size, extension, owner).
3. **Leadership Principles**: Customer Obsession, Ownership, and Dive Deep took up 50% of every 60-minute round!

Tips: Have at least 2 distinct concrete stories for every single Amazon Leadership Principle!`,
    category: 'interview_experience',
    companyId: 'amazon',
    tags: JSON.stringify(['Amazon', 'AWS', 'SDE II', 'BFS', 'Leadership Principles']),
    upvotesCount: 29,
  },
  {
    title: 'Optimal Intuition for Trapping Rain Water (#42) - Two Pointers vs Monotonic Stack',
    content: `A quick theoretical summary of why Two Pointers runs in $O(N)$ time and $O(1)$ auxiliary space for LeetCode #42:

At any index $i$, the water trapped is strictly bounded by:
$$\\min(\\text{left\\_max}, \\text{right\\_max}) - \\text{height}[i]$$

When \`left_max < right_max\`, the bottleneck for \`left\` is guaranteed to be \`left_max\`, regardless of what happens in between. Hence we can advance the left pointer monotonically. When \`right_max <= left_max\`, the bottleneck is guaranteed by \`right_max\`.

This avoids needing extra memory arrays!`,
    category: 'question_help',
    companyId: 'google',
    questionId: 42,
    tags: JSON.stringify(['Two Pointers', 'Array', 'Optimal Approach', 'Problem #42']),
    upvotesCount: 51,
  },
  {
    title: 'How I passed Microsoft SWE Screening in 3 weeks of targeted practice',
    content: `Key patterns Microsoft interviewers test repeatedly:
1. Linked List Reversal & Cycle Detection (Fast & Slow pointers)
2. String Manipulation and Anagram grouping
3. Binary Tree Traversals (Inorder iterative, level order)
4. Matrix manipulations (Rotate Image, Spiral Matrix)

Cheat Code company frequency filters were spot-on for the 30-day window!`,
    category: 'general',
    companyId: 'microsoft',
    tags: JSON.stringify(['Microsoft', 'Preparation', 'Linked List', 'Fast-Track']),
    upvotesCount: 24,
  },
];

export class CommunityController {
  /**
   * Helper to ensure seed data is populated if community table is empty
   */
  private static async ensureSeeded(): Promise<void> {
    try {
      const count = await prisma.communityPost.count();
      if (count === 0) {
        // Find or create a verified system user for seed posts
        let seedUser = await prisma.user.findFirst({
          where: { email: 'verified@cheatcode.dev' },
        });

        if (!seedUser) {
          seedUser = await prisma.user.findFirst();
        }

        if (!seedUser) {
          seedUser = await prisma.user.create({
            data: {
              email: 'verified@cheatcode.dev',
              name: 'CheatCode Verified Engineer',
              tier: 'pro',
              targetCompany: 'google',
            },
          });
        }

        for (const p of INITIAL_SEEDED_POSTS) {
          await prisma.communityPost.create({
            data: {
              userId: seedUser.id,
              title: p.title,
              content: p.content,
              category: p.category,
              companyId: p.companyId,
              questionId: (p as any).questionId || null,
              tags: p.tags,
              upvotesCount: p.upvotesCount,
            },
          });
        }
      }
    } catch (err) {
      console.warn('Auto-seed check non-blocking warning:', err);
    }
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

      res.json({
        activeEngineers: Math.max(userCount, 1280),
        solutionsSolved: solvedCount,
        companiesIndexed: 659,
        verifiedQuestions: 3399,
        communityPosts: postCount,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getLeaderboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await prisma.user.findMany({
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

      res.json(ranked);
    } catch (err) {
      next(err);
    }
  }

  static async getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await CommunityController.ensureSeeded();

      const { category, company, search, sortBy = 'hot', page = '1', limit = '20' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (category && category !== 'all') {
        where.category = String(category);
      }
      if (company && company !== 'all') {
        where.companyId = String(company).toLowerCase();
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
          authorName: p.user?.name || 'Anonymous Engineer',
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
      const post: any = await prisma.communityPost.findUnique({
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
          _count: {
            select: { upvotes: true, comments: true },
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
        authorName: c.user?.name || 'Engineer',
        authorAvatar: c.user?.avatarUrl || null,
        authorTier: c.user?.tier || 'free',
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      }));

      res.json({
        id: post.id,
        userId: post.userId,
        authorName: post.user?.name || 'Anonymous Engineer',
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
      });
    } catch (err) {
      next(err);
    }
  }

  static async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required to create a post.' });
        return;
      }

      const { title, content, category = 'general', companyId, questionId, tags }: CreatePostInput = req.body;

      if (!title || title.trim().length < 5) {
        res.status(400).json({ error: 'Title must be at least 5 characters long.' });
        return;
      }

      if (!content || content.trim().length < 10) {
        res.status(400).json({ error: 'Post content must be at least 10 characters long.' });
        return;
      }

      const post: any = await prisma.communityPost.create({
        data: {
          userId: req.user.id,
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
          userId: req.user.id,
          postId: post.id,
        },
      }).catch(() => {});

      let parsedTags: string[] = [];
      try {
        parsedTags = JSON.parse(post.tags);
      } catch {
        parsedTags = [];
      }

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
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required to post a comment.' });
        return;
      }

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

      const comment: any = await prisma.communityComment.create({
        data: {
          postId: id,
          userId: req.user.id,
          content: content.trim(),
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, tier: true },
          },
        },
      });

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
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required to upvote.' });
        return;
      }

      const id = String(req.params.id);
      const existing = await prisma.communityUpvote.findUnique({
        where: {
          userId_postId: {
            userId: req.user.id,
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
              userId: req.user.id,
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
            userId: req.user.id,
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

      res.json({
        upvoted,
        upvotesCount: Math.max(0, post.upvotesCount),
      });
    } catch (err) {
      next(err);
    }
  }
}
