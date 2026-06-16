import { Router } from 'express';
import { updateProfile, togglePinRoom, getActiveUsers, searchUsers } from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { createRateLimitMiddleware } from '../middlewares/rateLimit.middleware';

const router = Router();
router.use(requireAuth);

const updateProfileLimiter = createRateLimitMiddleware({ scope: 'user:profile', limit: 10, windowSeconds: 60, identifier: 'user' });
const pinRoomLimiter = createRateLimitMiddleware({ scope: 'user:pin', limit: 20, windowSeconds: 60, identifier: 'user' });

router.patch('/profile', updateProfileLimiter, updateProfile);
router.post('/pinned-rooms/:roomId', pinRoomLimiter, togglePinRoom);
router.get('/active', getActiveUsers);
router.get('/search', searchUsers);

export default router;
