import api from './api';
import type {
  CreateInterviewRequest,
  RunInterviewCodeRequest,
  SubmitInterviewCodeRequest,
  IInterviewSession,
  IInterviewSubmission,
  InterviewTimerResponse,
  InterviewReport
} from '@devmeet/shared';

export const interviewService = {
  joinSession: async (data: { roomId: string; role: 'interviewer' | 'candidate' }) => {
    const res = await api.post<{ data: { session: IInterviewSession } }>('/api/interviews/join', data);
    return res.data.data.session;
  },

  getSession: async (sessionId: string) => {
    const res = await api.get<{ data: { session: IInterviewSession } }>(`/api/interviews/${sessionId}`);
    return res.data.data.session;
  },

  startSession: async (sessionId: string) => {
    const res = await api.post<{ data: { session: IInterviewSession } }>(`/api/interviews/${sessionId}/start`);
    return res.data.data.session;
  },

  endSession: async (sessionId: string) => {
    const res = await api.post<{ data: { session: IInterviewSession } }>(`/api/interviews/${sessionId}/end`);
    return res.data.data.session;
  },

  assignProblem: async (sessionId: string, problemId: string) => {
    const res = await api.patch<{ data: { session: IInterviewSession } }>(`/api/interviews/${sessionId}/problem`, { problemId });
    return res.data.data.session;
  },

  updateNotes: async (sessionId: string, notes: string) => {
    const res = await api.patch<{ data: { session: IInterviewSession } }>(`/api/interviews/${sessionId}/notes`, { notes });
    return res.data.data.session;
  },

  runCode: async (sessionId: string, data: RunInterviewCodeRequest) => {
    const res = await api.post<{ data: { jobId: string; status: string } }>(`/api/interviews/${sessionId}/run`, data);
    return res.data.data;
  },

  submitCode: async (sessionId: string, data: SubmitInterviewCodeRequest) => {
    const res = await api.post<{ data: { submissionId: string; status: string } }>(`/api/interviews/${sessionId}/submit`, data);
    return res.data.data;
  },

  getSubmission: async (submissionId: string) => {
    const res = await api.get<{ data: { submission: IInterviewSubmission } }>(`/api/interviews/submissions/${submissionId}`);
    return res.data.data.submission;
  },

  getTimer: async (sessionId: string) => {
    const res = await api.get<{ data: InterviewTimerResponse }>(`/api/interviews/${sessionId}/timer`);
    return res.data.data;
  },

  getReport: async (sessionId: string) => {
    const res = await api.get<{ data: { report: InterviewReport } }>(`/api/interviews/${sessionId}/report`);
    return res.data.data.report;
  }
};
