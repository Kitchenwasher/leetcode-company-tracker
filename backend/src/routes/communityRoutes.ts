import { Router } from 'express';
import { CommunityController } from '../controllers/communityController.js';

const router = Router();

router.get('/stats', CommunityController.getCommunityStats);
router.get('/leaderboard', CommunityController.getLeaderboard);

export default router;
