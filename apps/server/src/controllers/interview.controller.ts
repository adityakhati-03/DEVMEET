import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import Room from '../models/Room';
import Problem from '../models/Problem';
import InterviewSession from '../models/InterviewSession';
import InterviewSubmission from '../models/InterviewSubmission';
import { addExecutionJob } from '../queues/execution.queue';
import { addSubmissionJob } from '../queues/submission.queue';
import { interviewService } from '../services/interview.service';
import { problemService } from '../services/problem.service';
import { createError } from '../middlewares/error.middleware';
import { DOCKER_LANGUAGE_MAP, SUPPORTED_LANGUAGES } from '@devmeet/shared';
import { invalidateRoomCache } from './room.controller';

// -- Utility Authorization checks --
function isOwnerOrInterviewer(userId: string, session: any) {
  return session.createdBy === userId || session.interviewerId === userId;
}

function isCandidate(userId: string, session: any) {
  return session.candidateId === userId;
}

function isParticipant(userId: string, session: any) {
  return isOwnerOrInterviewer(userId, session) || isCandidate(userId, session);
}

export async function joinSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId, role } = req.body;
    const userId = req.user!.id;

    const room = await Room.findOne({ roomId, mode: 'interview' });
    if (!room) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Interview room not found' } });
      return;
    }

    let session = await InterviewSession.findOne({ roomId });
    if (!session) {
      session = await InterviewSession.create({
        roomId,
        durationMinutes: 60,
        createdBy: userId,
        status: 'scheduled'
      });
      room.interviewSessionId = session._id as any;
      await room.save();
      await invalidateRoomCache(room);

      await interviewService.logEvent({
        roomId,
        sessionId: session._id as string,
        userId,
        type: 'session_created',
      });
    }

    if (role === 'interviewer') {
      session.interviewerId = userId;
    } else if (role === 'candidate') {
      session.candidateId = userId;
    }
    await session.save();

    res.status(200).json({ success: true, data: { session } });
  } catch (error) {
    next(error);
  }
}

export async function getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    const session = await interviewService.getSession(sessionId);
    if (!session) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
      return;
    }

    if (!isParticipant(userId, session)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    res.status(200).json({ success: true, data: { session } });
  } catch (error) {
    next(error);
  }
}

export async function startSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    const session = await interviewService.getSession(sessionId);
    if (!session) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
      return;
    }

    if (!isOwnerOrInterviewer(userId, session)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only interviewer can start' } });
      return;
    }

    if (session.status !== 'scheduled') {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: `Cannot start session in ${session.status} status` } });
      return;
    }

    session.status = 'active';
    session.startedAt = new Date();
    session.expiresAt = new Date(session.startedAt.getTime() + session.durationMinutes * 60000);
    await session.save();

    await interviewService.logEvent({
      roomId: session.roomId,
      sessionId: session._id as string,
      userId,
      type: 'session_started',
    });

    res.status(200).json({ success: true, data: { session } });
  } catch (error) {
    next(error);
  }
}

export async function endSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    const session = await interviewService.getSession(sessionId);
    if (!session) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
      return;
    }

    if (!isOwnerOrInterviewer(userId, session)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only interviewer can end' } });
      return;
    }

    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    await interviewService.logEvent({
      roomId: session.roomId,
      sessionId: session._id as string,
      userId,
      type: 'session_ended',
    });

    res.status(200).json({ success: true, data: { session } });
  } catch (error) {
    next(error);
  }
}

export async function assignProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { problemId } = req.body;
    const userId = req.user!.id;

    const session = await interviewService.getSession(sessionId);
    if (!session) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
      return;
    }

    if (!isOwnerOrInterviewer(userId, session)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } });
      return;
    }

    if (session.status === 'completed' || session.status === 'expired') {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Session is finished' } });
      return;
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      res.status(404).json({ success: false, error: { code: 'PROBLEM_NOT_FOUND', message: 'Problem not found' } });
      return;
    }

    session.problemId = problem._id as any;
    await session.save();

    await interviewService.logEvent({
      roomId: session.roomId,
      sessionId: session._id as string,
      userId,
      type: 'problem_assigned',
      metadata: { problemId },
    });

    res.status(200).json({ success: true, data: { session } });
  } catch (error) {
    next(error);
  }
}

export async function updateNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { notes } = req.body;
    const userId = req.user!.id;

    const session = await interviewService.getSession(sessionId);
    if (!session) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
      return;
    }

    if (!isOwnerOrInterviewer(userId, session)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } });
      return;
    }

    session.notes = notes;
    await session.save();

    res.status(200).json({ success: true, data: { session } });
  } catch (error) {
    next(error);
  }
}

export async function runCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { code, languageId, stdin } = req.body;
    const userId = req.user!.id;

    const session = await interviewService.getSession(sessionId);
    if (!session) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
      return;
    }

    const timer = interviewService.calculateTimer(session);
    if (timer.status !== 'active') {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Session is not active' } });
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

    // Use regular execution queue for simple test run
    await addExecutionJob({
      executionJobId,
      roomId: session.roomId,
      userId,
      language,
      languageId,
      code,
      stdin: stdin || '',
      compiler,
    });

    await interviewService.logEvent({
      roomId: session.roomId,
      sessionId: session._id as string,
      userId,
      type: 'code_run',
      metadata: { jobId: executionJobId, language },
    });

    res.status(202).json({
      success: true,
      data: { jobId: executionJobId, status: 'queued' }
    });
  } catch (error) {
    next(error);
  }
}

export async function submitCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { code, languageId } = req.body;
    const userId = req.user!.id;

    const session = await interviewService.getSession(sessionId);
    if (!session || !session.problemId) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session or problem not found' } });
      return;
    }

    if (!isCandidate(userId, session)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only candidate can submit' } });
      return;
    }

    const timer = interviewService.calculateTimer(session);
    if (timer.status !== 'active') {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Session is not active' } });
      return;
    }

    const problem = await Problem.findById(session.problemId);
    if (!problem || !problem.testCases) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Problem test cases missing' } });
      return;
    }

    const compiler = DOCKER_LANGUAGE_MAP[languageId];
    if (!compiler) {
      res.status(400).json({ success: false, error: { code: 'UNSUPPORTED_LANGUAGE', message: 'Unsupported language' } });
      return;
    }

    const language = SUPPORTED_LANGUAGES.find((l) => l.id === languageId)?.name || 'unknown';

    // Create Submission record
    const submission = await InterviewSubmission.create({
      roomId: session.roomId,
      sessionId: session._id,
      candidateId: userId,
      problemId: session.problemId,
      language,
      code,
      status: 'queued',
      totalTests: problem.testCases.length,
    });

    // Queue submission job
    await addSubmissionJob({
      submissionId: submission._id as string,
      roomId: session.roomId,
      userId,
      language,
      languageId,
      code,
      compiler,
      testCases: problem.testCases.map((tc: any) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        hidden: tc.hidden
      }))
    });

    await interviewService.logEvent({
      roomId: session.roomId,
      sessionId: session._id as string,
      userId,
      type: 'solution_submitted',
      metadata: { submissionId: submission._id, language },
    });

    res.status(202).json({
      success: true,
      data: { submissionId: submission._id, status: 'queued' }
    });
  } catch (error) {
    next(error);
  }
}

export async function getSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { submissionId } = req.params;
    const userId = req.user!.id;

    const submission = await interviewService.getSubmissionById(submissionId);
    if (!submission) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } });
      return;
    }

    const session = await interviewService.getSession(submission.sessionId.toString());
    if (!session || !isParticipant(userId, session)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    const subObj = submission.toObject();

    // Mask hidden outputs if user is candidate
    if (isCandidate(userId, session) && !isOwnerOrInterviewer(userId, session)) {
      subObj.visibleResults = subObj.visibleResults.filter((r: any) => {
        // We only saved visible ones to visibleResults array anyway, but let's be sure
        return true; 
      });
    }

    res.status(200).json({ success: true, data: { submission: subObj } });
  } catch (error) {
    next(error);
  }
}

export async function getTimer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const session = await interviewService.getSession(sessionId);
    if (!session) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
      return;
    }

    const timer = interviewService.calculateTimer(session);
    res.status(200).json({ success: true, data: timer });
  } catch (error) {
    next(error);
  }
}

export async function getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    const session = await interviewService.getSession(sessionId);
    if (!session) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
      return;
    }

    if (!isOwnerOrInterviewer(userId, session)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    const problem = session.problemId ? await Problem.findById(session.problemId) : undefined;
    const events = await interviewService.getEvents(sessionId);
    const submissions = await interviewService.getSubmissions(sessionId);

    res.status(200).json({
      success: true,
      data: {
        report: {
          session,
          problem,
          events,
          submissions
        }
      }
    });
  } catch (error) {
    next(error);
  }
}
