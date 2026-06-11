import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { createRateLimitMiddleware } from '../middlewares/rateLimit.middleware';
import { generateTestCases, saveTestCases } from '../controllers/testCase.controller';

const router = Router();

// Rate limiters
const generateRateLimit = createRateLimitMiddleware({
  scope: 'ai:testcase:generate',
  limit: 10,
  windowSeconds: 3600, // 1 hour
  identifier: 'user',
});

const saveRateLimit = createRateLimitMiddleware({
  scope: 'testcase:save',
  limit: 30,
  windowSeconds: 3600, // 1 hour
  identifier: 'user',
});

router.post('/generate', requireAuth, generateRateLimit, generateTestCases);
router.post('/save', requireAuth, saveRateLimit, saveTestCases);

export default router;
