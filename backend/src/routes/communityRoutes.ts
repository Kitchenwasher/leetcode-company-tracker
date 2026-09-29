import { Router } from 'express';
import { CommunityController } from '../controllers/communityController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Stats & Leaderboard
router.get('/stats', CommunityController.getCommunityStats);
router.get('/leaderboard', CommunityController.getLeaderboard);

// Community Posts & Discussions
router.get('/posts', optionalAuth, CommunityController.getPosts);
router.post('/posts', optionalAuth, CommunityController.createPost);
router.get('/posts/:id', optionalAuth, CommunityController.getPostById);
router.post('/posts/:id/comments', optionalAuth, CommunityController.addComment);
router.post('/posts/:id/upvote', optionalAuth, CommunityController.toggleUpvote);

export default router;
