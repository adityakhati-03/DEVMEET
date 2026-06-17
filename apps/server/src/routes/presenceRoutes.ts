import { Router } from 'express';
import { getPresence } from '../controllers/presenceController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint for checking and reporting online presence
router.get('/', requireAuth, getPresence);

export default router;
