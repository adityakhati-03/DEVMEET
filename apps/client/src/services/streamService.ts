import api from './api';

export const streamService = {
  /**
   * Get a Stream Video token for the current authenticated user.
   * Optionally pass a roomId to verify membership before token generation.
   */
  async getStreamToken(roomId?: string): Promise<string> {
    const res = await api.post<{ success: true; data: { token: string } }>(
      '/api/stream/token',
      { roomId }
    );
    return res.data.data.token;
  },
};
