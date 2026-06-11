import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getProblems, getProblem } from '../controllers/problem.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getProblems);
router.get('/:problemId', getProblem);

export default router;
