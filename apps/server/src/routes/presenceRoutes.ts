import { Router } from 'express';
import { getPresence } from '../controllers/presenceController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint for checking and reporting online presence
router.get('/', protect, getPresence);

export default router;
