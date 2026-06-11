import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import Room from '../models/Room';
import Problem from '../models/Problem';
import PracticeAttempt from '../models/PracticeAttempt';
import ExecutionJob from '../models/ExecutionJob.model';
import { addExecutionJob } from '../queues/execution.queue';
import { practiceService } from '../services/practice.service';
import { problemService } from '../services/problem.service';
import { createError } from '../middlewares/error.middleware';
import { DOCKER_LANGUAGE_MAP, SUPPORTED_LANGUAGES } from '@devmeet/shared';

export async function createPracticeRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { problemId, title } = req.body;
    const userId = req.user!.id;
    const roomId = Math.random().toString(36).substring(2, 12);

    // Validate problem if provided
    let problem: any = null;
    if (problemId) {
      problem = await Problem.findById(problemId);
      if (!problem) {
        res.status(404).json({ success: false, error: { code: 'PROBLEM_NOT_FOUND', message: 'Problem not found' } });
        return;
      }
    }

    const newRoom = await Room.create({
      roomId,
      title: title || (problem ? problem.title : 'Practice Room'),
      mode: 'practice',
      interviewType: null,
      problemId: problem ? problem._id : undefined,
      settings: {
        videoEnabled: false,
        collaborationEnabled: false,
        isSolo: true,
      },
      createdBy: userId,
      participants: [userId],
    });

    const responseData: any = { room: newRoom };
    if (problemId) {
      const problemObj = problem.toObject();
      const safeTestCases = problemObj.testCases.map((tc: any) => tc.hidden ? { input: tc.input, hidden: true } : tc);
      responseData.problem = { ...problemObj, testCases: safeTestCases };
    }

    res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
}

export async function getPracticeRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;

    const room = await Room.findOne({ roomId, mode: 'practice' });
    if (!room) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Practice room not found' } });
      return;
    }

    if (room.createdBy.toString() !== userId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only access your own practice rooms' } });
      return;
    }

    const responseData: any = { room };
    if (room.problemId) {
      const problem = await problemService.getProblemById(room.problemId.toString());
      if (problem) {
        const problemObj = problem.toObject();
        const safeTestCases = problemObj.testCases.map((tc: any) => tc.hidden ? { input: tc.input, hidden: true } : tc);
        responseData.problem = { ...problemObj, testCases: safeTestCases };
      }
    }

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
}

export async function updatePracticeRoomProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId } = req.params;
    const { problemId } = req.body;
    const userId = req.user!.id;

    const room = await Room.findOne({ roomId, mode: 'practice' });
    if (!room) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Practice room not found' } });
      return;
    }

    if (room.createdBy.toString() !== userId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } });
      return;
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      res.status(404).json({ success: false, error: { code: 'PROBLEM_NOT_FOUND', message: 'Problem not found' } });
      return;
    }

    room.problemId = problem._id;
    room.title = problem.title;
    await room.save();

    const problemObj = problem.toObject();
    const safeTestCases = problemObj.testCases.map((tc: any) => tc.hidden ? { input: tc.input, hidden: true } : tc);

    res.status(200).json({ success: true, data: { room, problem: { ...problemObj, testCases: safeTestCases } } });
  } catch (error) {
    next(error);
  }
}

export async function runPracticeCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId } = req.params;
    const { code, languageId, stdin } = req.body;
    const userId = req.user!.id;

    const room = await Room.findOne({ roomId, mode: 'practice', createdBy: userId });
    if (!room) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Practice room not found' } });
      return;
    }

    if (!code || code.length > 50_000) {
      res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid or too large code' } });
      return;
    }

    const compiler = DOCKER_LANGUAGE_MAP[languageId];
    if (!compiler) {
      res.status(400).json({ success: false, error: { code: 'UNSUPPORTED_LANGUAGE', message: 'Unsupported language' } });
      return;
    }

    const language = SUPPORTED_LANGUAGES.find((l) => l.id === languageId)?.name || 'unknown';
    const executionJobId = randomUUID();

    // 1. Create execution job
    await ExecutionJob.create({
      jobId: executionJobId,
      roomId,
      userId,
      language,
      languageId,
      code,
      stdin: stdin || '',
      status: 'queued',
      compiler,
    });

    // 2. Create Practice Attempt linked to job
    const attempt = await PracticeAttempt.create({
      userId,
      roomId,
      problemId: room.problemId,
      language,
      code,
      stdin: stdin || '',
      status: 'queued',
      executionJobId,
    });

    // 3. Queue to BullMQ
    await addExecutionJob({
      executionJobId,
      roomId,
      userId,
      language,
      languageId,
      code,
      stdin: stdin || '',
      compiler,
    });

    res.status(202).json({
      success: true,
      data: {
        attemptId: attempt._id,
        jobId: executionJobId,
        status: 'queued',
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttempts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;
    const attempts = await practiceService.getAttempts(userId, roomId);
    res.status(200).json({ success: true, data: { attempts } });
  } catch (error) {
    next(error);
  }
}

export async function getAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { attemptId } = req.params;
    const userId = req.user!.id;

    const attempt = await practiceService.getAttemptById(attemptId);
    if (!attempt) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attempt not found' } });
      return;
    }

    if (attempt.userId !== userId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } });
      return;
    }

    res.status(200).json({ success: true, data: { attempt } });
  } catch (error) {
    next(error);
  }
}
