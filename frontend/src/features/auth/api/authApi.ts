import { apiClient } from '../../../services/api/apiClient';
import type { AuthSession, AuthUser, LoginCredentials, RegisterInput } from '../../../types/auth.types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>('/auth/login', credentials);
    return response.data;
  },
  async register(input: RegisterInput): Promise<void> {
    const { role, ...details } = input;
    const registrationPath = role === 'family' ? '/auth/register/family'
      : role === 'vendor' ? '/auth/register/vendor'
        : role === 'planner' ? '/auth/register/planner'
          : null;
    if (!registrationPath) throw new Error('Public registration is not available for this account type.');
    await apiClient.post(registrationPath, details);
  },
  async verifyOtp(email: string, code: string): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>('/auth/verify-otp', { email, code });
    return response.data;
  },
  async me(): Promise<AuthSession> {
    const response = await apiClient.get<AuthSession>('/auth/me');
    return response.data;
  },
  async switchMembership(membershipId: string, refreshToken: string | null): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>('/auth/switch-membership', {
      membershipId,
      refreshToken,
    });
    return response.data;
  },
  async logout(refreshToken: string | null): Promise<void> {
    await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : {});
  },
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password-reset/request', { email });
  },
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password-reset', { email, code, newPassword });
  },
  async updateProfile(input: Partial<Pick<AuthUser, 'name' | 'phone'>>): Promise<AuthUser> {
    const response = await apiClient.patch<{ user: AuthUser }>('/auth/me', input);
    return response.data.user;
  },
};
