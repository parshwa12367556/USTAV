import { apiClient } from '../../../services/api/apiClient';
import type { AuthResult, AuthSession, AuthUser, LoginCredentials, RegisterInput, UserSessionInfo } from '../../../types/auth.types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const response = await apiClient.post<AuthResult>('/auth/login', credentials);
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
  async verifyOtp(email: string, code: string): Promise<AuthResult> {
    const response = await apiClient.post<AuthResult>('/auth/verify-otp', { email, code });
    return response.data;
  },
  async me(): Promise<AuthSession> {
    const response = await apiClient.get<AuthSession>('/auth/me');
    return response.data;
  },
  async switchMembership(membershipId: string): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>('/auth/switch-membership', {
      membershipId,
    });
    return response.data;
  },
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {});
  },
  async setupAdminMfa(): Promise<{ secret: string; otpauthUri: string; qrCodeSvg: string }> {
    const response = await apiClient.post<{ secret: string; otpauthUri: string; qrCodeSvg: string }>('/auth/2fa/setup', {});
    return response.data;
  },
  async verifyAdminMfa(code: string): Promise<AuthSession> {
    const response = await apiClient.post<AuthSession>('/auth/2fa/verify', { code });
    return response.data;
  },
  async listSessions(): Promise<UserSessionInfo[]> {
    const response = await apiClient.get<{ sessions: UserSessionInfo[] }>('/auth/sessions');
    return response.data.sessions;
  },
  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${encodeURIComponent(sessionId)}`);
  },
  async revokeOtherSessions(): Promise<number> {
    const response = await apiClient.post<{ revokedCount: number }>('/auth/sessions/revoke-others', {});
    return response.data.revokedCount;
  },
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password-reset/request', { email });
  },
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password-reset', { email, code, newPassword });
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password/change', { currentPassword, newPassword });
  },
  async updateProfile(input: Partial<Pick<AuthUser, 'name' | 'phone'>>): Promise<AuthUser> {
    const response = await apiClient.patch<{ user: AuthUser }>('/auth/me', input);
    return response.data.user;
  },
};
