import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import * as controller from '../controllers/aiInterview.controller';

const router = Router();

router.use(requireAuth);

router.post('/', controller.createSession);
router.post('/setup', controller.setupSession);
router.get('/:sessionId', controller.getSession);
router.post('/:sessionId/start', controller.startSession);
router.post('/:sessionId/message', controller.sendMessage);
router.post('/:sessionId/hint', controller.requestHint);
router.post('/:sessionId/review-code', controller.reviewCode);
router.get('/:sessionId/messages', controller.getMessages);
router.post('/:sessionId/submit', controller.submitInterview);
router.get('/:sessionId/report', controller.getReport);

export default router;
