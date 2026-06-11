import { Router } from 'express';
import { getStreamToken } from '../controllers/stream.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { createRateLimitMiddleware } from '../middlewares/rateLimit.middleware';

const router = Router();
router.use(requireAuth);

const tokenLimiter = createRateLimitMiddleware({ scope: 'stream:token', limit: 30, windowSeconds: 60, identifier: 'user' });
router.post('/token', tokenLimiter, getStreamToken);

export default router;
