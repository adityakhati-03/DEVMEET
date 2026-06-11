import api from './api';
import type { 
  CreatePracticeRoomRequest, 
  PracticeRoomResponse, 
  RunPracticeCodeRequest,
  IPracticeAttempt
} from '@devmeet/shared';

export const practiceService = {
  async createPracticeRoom(data: CreatePracticeRoomRequest) {
    const res = await api.post<{ success: boolean; data: PracticeRoomResponse }>('/api/practice/rooms', data);
    return res.data.data;
  },

  async getPracticeRoom(roomId: string) {
    const res = await api.get<{ success: boolean; data: PracticeRoomResponse }>(`/api/practice/rooms/${roomId}`);
    return res.data.data;
  },

  async updatePracticeRoomProblem(roomId: string, problemId: string) {
    const res = await api.patch<{ success: boolean; data: PracticeRoomResponse }>(`/api/practice/rooms/${roomId}/problem`, { problemId });
    return res.data.data;
  },

  async runPracticeCode(roomId: string, data: RunPracticeCodeRequest) {
    const res = await api.post<{ success: boolean; data: { attemptId: string; jobId: string; status: string } }>(
      `/api/practice/rooms/${roomId}/run`, 
      data
    );
    return res.data.data;
  },

  async getAttempts(roomId: string) {
    const res = await api.get<{ success: boolean; data: { attempts: IPracticeAttempt[] } }>(`/api/practice/rooms/${roomId}/attempts`);
    return res.data.data.attempts;
  },

  async getAttempt(attemptId: string) {
    const res = await api.get<{ success: boolean; data: { attempt: IPracticeAttempt } }>(`/api/practice/attempts/${attemptId}`);
    return res.data.data.attempt;
  }
};
