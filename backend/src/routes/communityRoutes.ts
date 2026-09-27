import { Router } from 'express';
import { CommunityController } from '../controllers/communityController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Stats & Leaderboard
router.get('/stats', CommunityController.getCommunityStats);
router.get('/leaderboard', CommunityController.getLeaderboard);

// Community Posts & Discussions
router.get('/posts', optionalAuth, CommunityController.getPosts);
router.post('/posts', authenticateToken, CommunityController.createPost);
router.get('/posts/:id', optionalAuth, CommunityController.getPostById);
router.post('/posts/:id/comments', authenticateToken, CommunityController.addComment);
router.post('/posts/:id/upvote', authenticateToken, CommunityController.toggleUpvote);

export default router;
