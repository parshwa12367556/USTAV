import { apiClient } from '../../../services/api/apiClient';
import type { AuthSession, LoginCredentials, RegisterInput } from '../../../types/auth.types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>('/auth/login', credentials);
    return response.data;
  },
  async register(input: RegisterInput): Promise<void> {
    await apiClient.post('/auth/register', input);
  },
  async verifyOtp(email: string, code: string): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>('/auth/verify-otp', { email, code });
    return response.data;
  },
};
