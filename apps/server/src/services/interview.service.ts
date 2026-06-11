import InterviewSession from '../models/InterviewSession';
import InterviewSubmission from '../models/InterviewSubmission';
import InterviewEvent from '../models/InterviewEvent';
import Room from '../models/Room';
import type { IInterviewSession, IInterviewEvent, IInterviewSubmission } from '@devmeet/shared';

export const interviewService = {
  async createSession(data: { roomId: string; candidateId: string; durationMinutes: number; problemId?: string; createdBy: string }) {
    return InterviewSession.create({
      ...data,
      interviewerId: data.createdBy,
      status: 'scheduled'
    });
  },

  async getSession(sessionId: string) {
    return InterviewSession.findById(sessionId);
  },

  async getSessionByRoomId(roomId: string) {
    return InterviewSession.findOne({ roomId }).sort({ createdAt: -1 });
  },

  async logEvent(data: { roomId: string; sessionId: string; userId: string; type: string; metadata?: any }) {
    return InterviewEvent.create(data);
  },

  async getSubmissions(sessionId: string) {
    return InterviewSubmission.find({ sessionId }).sort({ createdAt: -1 });
  },

  async getSubmissionById(submissionId: string) {
    return InterviewSubmission.findById(submissionId);
  },

  async getEvents(sessionId: string) {
    return InterviewEvent.find({ sessionId }).sort({ createdAt: 1 });
  },

  calculateTimer(session: IInterviewSession) {
    if (session.status === 'scheduled') {
      return { status: 'scheduled', startedAt: null, expiresAt: null, remainingSeconds: session.durationMinutes * 60 };
    }
    
    if (session.status === 'completed' || session.status === 'cancelled') {
      return { status: session.status, startedAt: session.startedAt, expiresAt: session.expiresAt, remainingSeconds: 0 };
    }

    if (!session.expiresAt) {
      return { status: session.status, startedAt: session.startedAt, expiresAt: null, remainingSeconds: 0 };
    }

    const expiresAtMs = new Date(session.expiresAt).getTime();
    const nowMs = Date.now();
    let remainingSeconds = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
    
    let status = session.status;
    if (remainingSeconds === 0 && status === 'active') {
      status = 'expired';
    }

    return {
      status,
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
      remainingSeconds
    };
  }
};
