import api from './api';
import type { ExecutionRequest, ExecutionResponse, IExecutionJob } from '@devmeet/shared';

export const executionService = {
  /**
   * Enqueues a code execution job. Returns immediately with a jobId.
   */
  async runCode(data: ExecutionRequest): Promise<ExecutionResponse> {
    const res = await api.post<{ success: true; data: ExecutionResponse }>('/api/execution/run', data);
    return res.data.data;
  },

  /**
   * Polls the status of a previously queued job.
   */
  async getJobStatus(jobId: string): Promise<IExecutionJob> {
    const res = await api.get<{ success: true; data: IExecutionJob }>(`/api/execution/jobs/${jobId}`);
    return res.data.data;
  },
};

/** Terminal states where polling should stop */
export const TERMINAL_STATUSES = new Set(['completed', 'failed', 'timeout']);
