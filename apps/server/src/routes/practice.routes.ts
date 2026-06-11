import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  createPracticeRoom,
  getPracticeRoom,
  updatePracticeRoomProblem,
  runPracticeCode,
  getAttempts,
  getAttempt
} from '../controllers/practice.controller';

const router = Router();

router.use(requireAuth);

router.post('/rooms', createPracticeRoom);
router.get('/rooms/:roomId', getPracticeRoom);
router.patch('/rooms/:roomId/problem', updatePracticeRoomProblem);
router.post('/rooms/:roomId/run', runPracticeCode);

router.get('/rooms/:roomId/attempts', getAttempts);
router.get('/attempts/:attemptId', getAttempt);

export default router;
