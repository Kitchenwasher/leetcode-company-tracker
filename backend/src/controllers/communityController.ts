import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

export class CommunityController {
  static async getCommunityStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [userCount, solvedCount] = await Promise.all([
        prisma.user.count(),
        prisma.userProgress.count({
          where: {
            status: { in: ['solved', 'mastered'] },
          },
        }),
      ]);

      res.json({
        activeEngineers: userCount,
        solutionsSolved: solvedCount,
        companiesIndexed: 659,
        verifiedQuestions: 3399,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Query users with their solved question counts
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

      // Map and compute rank
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
          streak: activeDaysCount,
          badge,
          tier: u.tier,
        };
      });

      // Sort descending by solved count
      mapped.sort((a, b) => b.solved - a.solved);

      // Assign rank
      const ranked = mapped.slice(0, 10).map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

      res.json(ranked);
    } catch (err) {
      next(err);
    }
  }
}
