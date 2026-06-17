import { Request, Response, NextFunction } from 'express';
import { aiInterviewService } from '../services/aiInterview.service';
import InterviewSession from '../models/InterviewSession';
import AIInterviewMessage from '../models/AIInterviewMessage';
import AIInterviewReport from '../models/AIInterviewReport';
import Room from '../models/Room';
import { z } from 'zod';
import { createError } from '../middlewares/error.middleware';
import { invalidateRoomCache } from './room.controller';

export async function createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId, problemId, durationMinutes, difficulty, focusAreas, interviewerStyle } = req.body;
    const userId = req.user!.id;

    const room = await Room.findOne({ roomId });
    if (!room || room.createdBy.toString() !== userId) {
      next(createError('Room not found or unauthorized', 404, 'NOT_FOUND'));
      return;
    }

    const session = await InterviewSession.create({
      roomId,
      candidateId: userId,
      problemId,
      status: 'scheduled',
      interviewType: 'ai',
      durationMinutes: durationMinutes || 45,
      createdBy: userId,
      aiConfig: {
        difficulty: difficulty || 'medium',
        focusAreas: focusAreas || [],
        interviewerStyle: interviewerStyle || 'balanced',
        allowHints: true,
        maxHints: 3,
      },
      aiState: {
        stage: 'intro',
        hintsUsed: 0,
        lastFeedbackAt: null,
        score: null
      }
    });

    room.interviewSessionId = session._id as any;
    if (problemId) room.problemId = problemId;
    await room.save();
    await invalidateRoomCache(room);

    res.status(201).json({ success: true, data: { session } });
  } catch (err) {
    next(err);
  }
}

export async function setupSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId, topic, difficulty, style, durationMinutes } = req.body;
    const userId = req.user!.id;

    const room = await Room.findOne({ roomId });
    if (!room || room.createdBy.toString() !== userId) {
      next(createError('Room not found or unauthorized', 404, 'NOT_FOUND'));
      return;
    }

    const problem = await aiInterviewService.generateDynamicProblem(topic, difficulty, style, userId);

    const session = await InterviewSession.create({
      roomId,
      candidateId: userId,
      problemId: problem._id,
      status: 'scheduled',
      interviewType: 'ai',
      durationMinutes: durationMinutes || 45,
      createdBy: userId,
      aiConfig: {
        difficulty: difficulty || 'medium',
        focusAreas: [topic],
        interviewerStyle: style || 'balanced',
        allowHints: true,
        maxHints: 3,
      },
      aiState: {
        stage: 'intro',
        hintsUsed: 0,
        lastFeedbackAt: null,
        score: null
      }
    });

    room.interviewSessionId = session._id as any;
    room.problemId = problem._id as any;
    await room.save();
    await invalidateRoomCache(room);

    res.status(201).json({ success: true, data: { session, problem } });
  } catch (err) {
    next(err);
  }
}

export async function getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      next(createError('Session not found', 404, 'NOT_FOUND'));
      return;
    }
    res.status(200).json({ success: true, data: { session } });
  } catch (err) {
    next(err);
  }
}

export async function startSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;
    const data = await aiInterviewService.startSession(sessionId, userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    if (!content) {
      next(createError('Message content required', 400, 'BAD_REQUEST'));
      return;
    }

    const data = await aiInterviewService.sendMessage(sessionId, userId, content);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function requestHint(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { currentCode } = req.body;
    const userId = req.user!.id;

    const data = await aiInterviewService.requestHint(sessionId, userId, currentCode || '');
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function reviewCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { currentCode, executionResults } = req.body;
    const userId = req.user!.id;

    const data = await aiInterviewService.reviewCode(sessionId, userId, currentCode || '', executionResults);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const messages = await AIInterviewMessage.find({ sessionId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: { messages } });
  } catch (err) {
    next(err);
  }
}

export async function getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const report = await AIInterviewReport.findOne({ sessionId });
    res.status(200).json({ success: true, data: { report } });
  } catch (err) {
    next(err);
  }
}

export async function submitInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { finalCode, executionSummary } = req.body;
    const userId = req.user!.id;

    const report = await aiInterviewService.generateReport(sessionId, finalCode, executionSummary);
    res.status(200).json({ success: true, data: { report } });
  } catch (err) {
    next(err);
  }
}
