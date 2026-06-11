import api from './api';
import type { AuthUser, LoginRequest, SignupRequest } from '@devmeet/shared';

interface AuthMeResponse {
  success: true;
  data: { user: AuthUser };
}

interface LoginResponse {
  success: true;
  data: { user: AuthUser; message: string };
}

interface SignupResponse {
  success: true;
  data: { username: string; message: string };
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthUser> {
    const res = await api.post<LoginResponse>('/api/auth/login', data);
    return res.data.data.user;
  },

  async signup(data: SignupRequest): Promise<{ username: string; message: string }> {
    const res = await api.post<SignupResponse>('/api/auth/signup', data);
    return res.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },

  async me(): Promise<AuthUser | null> {
    try {
      const res = await api.get<AuthMeResponse>('/api/auth/me');
      return res.data.data.user;
    } catch {
      return null;
    }
  },

  async verifyOtp(username: string, code: string): Promise<{ message: string }> {
    const res = await api.post('/api/auth/verify-otp', { username, code });
    return res.data.data;
  },

  async forgotPassword(email: string): Promise<{ message: string; username?: string }> {
    const res = await api.post('/api/auth/forgot-password', { email });
    return res.data.data;
  },

  async resetPassword(username: string, code: string, newPassword: string): Promise<{ message: string }> {
    const res = await api.post('/api/auth/reset-password', { username, code, newPassword });
    return res.data.data;
  },
};
