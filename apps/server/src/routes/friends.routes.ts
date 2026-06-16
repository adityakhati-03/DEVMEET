import { Router } from 'express';
import {
  getFriends,
  sendFriendRequest,
  respondToFriendRequest,
} from '../controllers/friends.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', getFriends);
router.post('/request', sendFriendRequest);
router.patch('/respond/:id', respondToFriendRequest);

export default router;
