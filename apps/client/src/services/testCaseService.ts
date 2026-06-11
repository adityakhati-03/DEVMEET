import api from './api';
import type {
  GenerateTestCasesRequest,
  GenerateTestCasesResponse,
  SaveTestCasesRequest,
  GeneratedTestCase,
} from '@devmeet/shared';

export const testCaseService = {
  async generateTestCases(payload: GenerateTestCasesRequest): Promise<GenerateTestCasesResponse & { discarded: number }> {
    const res = await api.post<{ success: boolean; data: GenerateTestCasesResponse & { discarded: number } }>(
      '/api/test-cases/generate',
      payload
    );
    return res.data.data;
  },

  async saveGeneratedTestCases(payload: SaveTestCasesRequest): Promise<{ saved: number }> {
    const res = await api.post<{ success: boolean; data: { saved: number } }>(
      '/api/test-cases/save',
      payload
    );
    return res.data.data;
  },
};
