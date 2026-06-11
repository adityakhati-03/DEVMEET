import { Router } from 'express';
import { runCode, getExecutionStatus } from '../controllers/execution.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { createRateLimitMiddleware } from '../middlewares/rateLimit.middleware';

const executionLimiter = createRateLimitMiddleware({ scope: 'execute:run', limit: 10, windowSeconds: 60, identifier: 'user' });

const router = Router();
router.use(requireAuth);

router.post('/run', executionLimiter, runCode);
router.get('/jobs/:jobId', getExecutionStatus);

export default router;
