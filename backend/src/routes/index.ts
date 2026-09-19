import { Router } from 'express';
import authRoutes from './authRoutes.js';
import questionRoutes from './questionRoutes.js';
import progressRoutes from './progressRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import emailRoutes from './emailRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/questions', questionRoutes);
router.use('/progress', progressRoutes);
router.use('/payments', paymentRoutes);
router.use('/mail', emailRoutes);

export default router;
