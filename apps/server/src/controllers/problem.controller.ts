import { Request, Response, NextFunction } from 'express';
import { problemService } from '../services/problem.service';
import type { ProblemDifficulty } from '@devmeet/shared';
import { createError } from '../middlewares/error.middleware';

export async function getProblems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { difficulty, tag, search } = req.query;
    
    const problems = await problemService.getProblems({
      difficulty: difficulty as ProblemDifficulty,
      tag: tag as string,
      search: search as string,
    });
    
    res.status(200).json({
      success: true,
      data: { problems },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { problemId } = req.params;
    const problem = await problemService.getProblemById(problemId);
    
    if (!problem) {
      next(createError('Problem not found', 404, 'PROBLEM_NOT_FOUND'));
      return;
    }
    
    const problemObj = problem.toObject();
    
    // Strip hidden expected outputs
    const safeTestCases = problemObj.testCases.map((tc: any) => {
      if (tc.hidden) {
        return { input: tc.input, hidden: true } as any;
      }
      return tc;
    });
    
    const safeProblem = {
      ...problemObj,
      testCases: safeTestCases,
    };
    
    res.status(200).json({
      success: true,
      data: { problem: safeProblem },
    });
  } catch (error) {
    next(error);
  }
}
