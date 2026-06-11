import { Router } from 'express';
import {
  getDiscussions,
  createDiscussion,
  getEvents,
  createEvent,
  getMembers,
} from '../controllers/community.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/discussions', getDiscussions);
router.post('/discussions', createDiscussion);
router.get('/events', getEvents);
router.post('/events', createEvent);
router.get('/members', getMembers);

export default router;
