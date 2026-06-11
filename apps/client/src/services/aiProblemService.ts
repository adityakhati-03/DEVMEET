import api from './api';
import type {
  AIProblemBuilderRequest,
  AIProblemBuilderResponse,
  SaveAIProblemRequest,
  AttachProblemToRoomRequest,
  GenerateAndAttachAIProblemRequest,
  ApiResponse,
} from '@devmeet/shared';

export const aiProblemService = {
  generate: async (data: AIProblemBuilderRequest & { roomId?: string }) => {
    const response = await api.post<ApiResponse<AIProblemBuilderResponse>>('/api/ai-problems/generate', data);
    return response.data.data;
  },

  save: async (data: SaveAIProblemRequest) => {
    const response = await api.post<ApiResponse<{ problemId: string }>>('/api/ai-problems/save', data);
    return response.data.data;
  },

  attachToRoom: async (data: AttachProblemToRoomRequest) => {
    const response = await api.post<ApiResponse<{ success: boolean }>>('/api/ai-problems/attach-to-room', data);
    return response.data.data;
  },

  generateAndAttach: async (data: GenerateAndAttachAIProblemRequest) => {
    const response = await api.post<ApiResponse<{ problemId: string, generatedProblem: any }>>('/api/ai-problems/generate-and-attach', data);
    return response.data.data;
  },
};
