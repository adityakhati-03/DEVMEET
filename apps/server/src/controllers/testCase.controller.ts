import { Request, Response, NextFunction } from 'express';
import { testCaseService } from '../services/testCase.service';
import type { GenerateTestCasesRequest, SaveTestCasesRequest } from '@devmeet/shared';
import { createError } from '../middlewares/error.middleware';

export async function generateTestCases(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const payload = req.body as GenerateTestCasesRequest;

    if (!payload.problemDescription || typeof payload.problemDescription !== 'string') {
      next(createError('problemDescription is required', 400, 'BAD_REQUEST'));
      return;
    }

    if (!payload.mode || !['collaboration', 'practice', 'interview'].includes(payload.mode)) {
      next(createError('A valid mode is required: collaboration | practice | interview', 400, 'BAD_REQUEST'));
      return;
    }

    const result = await testCaseService.generate(user, payload);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    if (err.code === 'FORBIDDEN') {
      next(createError(err.message, 403, 'FORBIDDEN'));
    } else if (err.code === 'AI_ERROR' || err.code === 'AI_PARSE_ERROR') {
      next(createError(err.message, 502, err.code));
    } else if (err.code === 'GEMINI_API_KEY_MISSING') {
      next(createError('AI service is not configured. Please contact support.', 503, 'SERVICE_UNAVAILABLE'));
    } else {
      next(err);
    }
  }
}

export async function saveTestCases(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const payload = req.body as SaveTestCasesRequest;

    if (!payload.generationId || !payload.problemId || !Array.isArray(payload.testCases)) {
      next(createError('generationId, problemId, and testCases are required', 400, 'BAD_REQUEST'));
      return;
    }

    const result = await testCaseService.save(user, payload);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    if (err.code === 'FORBIDDEN') {
      next(createError(err.message, 403, 'FORBIDDEN'));
    } else if (err.code === 'NOT_FOUND') {
      next(createError(err.message, 404, 'NOT_FOUND'));
    } else if (err.code === 'BAD_REQUEST') {
      next(createError(err.message, 400, 'BAD_REQUEST'));
    } else {
      next(err);
    }
  }
}
