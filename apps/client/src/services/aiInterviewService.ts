import api from './api';
import type { 
  CreateAIInterviewRequest, 
  SendAIMessageRequest,
  AIInterviewMessage,
  IInterviewSession,
  AIInterviewReport
} from '@devmeet/shared';

export const aiInterviewService = {
  createSession: async (data: CreateAIInterviewRequest): Promise<{ session: IInterviewSession }> => {
    const res = await api.post('/api/ai-interviews', data);
    return res.data.data;
  },

  setupSession: async (data: { roomId: string, topic: string, difficulty: string, style: string, durationMinutes?: number }): Promise<{ session: IInterviewSession, problem: any }> => {
    const res = await api.post('/api/ai-interviews/setup', data);
    return res.data.data;
  },

  getSession: async (sessionId: string): Promise<{ session: IInterviewSession }> => {
    const res = await api.get(`/api/ai-interviews/${sessionId}`);
    return res.data.data;
  },

  startSession: async (sessionId: string): Promise<{ session: IInterviewSession, message: AIInterviewMessage }> => {
    const res = await api.post(`/api/ai-interviews/${sessionId}/start`);
    return res.data.data;
  },

  sendMessage: async (sessionId: string, data: SendAIMessageRequest): Promise<{ userMessage: AIInterviewMessage, aiMessage: AIInterviewMessage }> => {
    const res = await api.post(`/api/ai-interviews/${sessionId}/message`, data);
    return res.data.data;
  },

  requestHint: async (sessionId: string, currentCode: string): Promise<AIInterviewMessage> => {
    const res = await api.post(`/api/ai-interviews/${sessionId}/hint`, { currentCode });
    return res.data.data;
  },

  reviewCode: async (sessionId: string, currentCode: string, executionResults?: string): Promise<AIInterviewMessage> => {
    const res = await api.post(`/api/ai-interviews/${sessionId}/review-code`, { currentCode, executionResults });
    return res.data.data;
  },

  getMessages: async (sessionId: string): Promise<{ messages: AIInterviewMessage[] }> => {
    const res = await api.get(`/api/ai-interviews/${sessionId}/messages`);
    return res.data.data;
  },

  submitInterview: async (sessionId: string, finalCode: string, executionSummary: string): Promise<{ report: AIInterviewReport }> => {
    const res = await api.post(`/api/ai-interviews/${sessionId}/submit`, { finalCode, executionSummary });
    return res.data.data;
  },

  getReport: async (sessionId: string): Promise<{ report: AIInterviewReport }> => {
    const res = await api.get(`/api/ai-interviews/${sessionId}/report`);
    return res.data.data;
  }
};
