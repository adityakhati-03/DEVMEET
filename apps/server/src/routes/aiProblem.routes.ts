import { Router } from 'express';
import { aiProblemController } from '../controllers/aiProblem.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { createRateLimitMiddleware } from '../middlewares/rateLimit.middleware';

const router = Router();

const generateLimit = createRateLimitMiddleware({
  scope: 'ai:problem:generate',
  limit: 10,
  windowSeconds: 3600, // 1 hour
  identifier: 'user',
});

const saveLimit = createRateLimitMiddleware({
  scope: 'ai:problem:save',
  limit: 30,
  windowSeconds: 3600, // 1 hour
  identifier: 'user',
});

router.post('/generate', requireAuth, generateLimit, aiProblemController.generate.bind(aiProblemController));
router.post('/save', requireAuth, saveLimit, aiProblemController.save.bind(aiProblemController));
router.post('/attach-to-room', requireAuth, aiProblemController.attachToRoom.bind(aiProblemController));
router.post('/generate-and-attach', requireAuth, generateLimit, aiProblemController.generateAndAttach.bind(aiProblemController));

export default router;
