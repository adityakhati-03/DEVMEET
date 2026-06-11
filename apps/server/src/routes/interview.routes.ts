import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  joinSession,
  getSession,
  startSession,
  endSession,
  assignProblem,
  updateNotes,
  runCode,
  submitCode,
  getSubmission,
  getTimer,
  getReport
} from '../controllers/interview.controller';

const router = Router();

router.use(requireAuth);

router.post('/join', joinSession);
router.get('/:sessionId', getSession);
router.post('/:sessionId/start', startSession);
router.post('/:sessionId/end', endSession);
router.patch('/:sessionId/problem', assignProblem);
router.patch('/:sessionId/notes', updateNotes);
router.post('/:sessionId/run', runCode);
router.post('/:sessionId/submit', submitCode);
router.get('/submissions/:submissionId', getSubmission);
router.get('/:sessionId/timer', getTimer);
router.get('/:sessionId/report', getReport);

export default router;
