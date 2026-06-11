import { Router } from 'express';
import {
  createRoom,
  getUserRooms,
  getRoom,
  joinRoom,
  deleteRoom,
  getRoomExecutions,
} from '../controllers/room.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { createRateLimitMiddleware } from '../middlewares/rateLimit.middleware';

const router = Router();

const createRoomLimiter = createRateLimitMiddleware({ scope: 'room:create', limit: 20, windowSeconds: 24 * 60 * 60, identifier: 'user' });
const joinRoomLimiter = createRateLimitMiddleware({ scope: 'room:join', limit: 20, windowSeconds: 10 * 60, identifier: 'user' });

// All room routes require authentication
router.use(requireAuth);

router.post('/', createRoomLimiter, createRoom);
router.get('/', getUserRooms);
router.get('/:roomId', getRoom);
router.post('/:roomId/join', joinRoomLimiter, joinRoom);
router.delete('/:roomId', deleteRoom);
router.get('/:roomId/executions', getRoomExecutions);

export default router;
