import api from './api';
import type { IProblem, ProblemDifficulty } from '@devmeet/shared';

export const problemService = {
  async getProblems(filters?: { difficulty?: ProblemDifficulty; tag?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.search) params.append('search', filters.search);
    
    const res = await api.get<{ success: boolean; data: { problems: IProblem[] } }>(`/api/problems?${params.toString()}`);
    return res.data.data.problems;
  },

  async getProblem(problemId: string) {
    const res = await api.get<{ success: boolean; data: { problem: IProblem } }>(`/api/problems/${problemId}`);
    return res.data.data.problem;
  },
};
