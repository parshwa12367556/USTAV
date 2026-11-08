import { apiClient } from '../../../services/api/apiClient';
import type { AuthSession } from '../../../types/auth.types';

export type WorkspaceMemberRole = 'owner' | 'member' | 'planner';

export type WorkspaceMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceMemberRole;
  status: string;
  permissions: WorkspacePermission[];
};

export type WorkspacePermission =
  | 'event.view'
  | 'event.create'
  | 'event.update'
  | 'event.delete'
  | 'function.manage'
  | 'guest.view'
  | 'guest.create'
  | 'guest.update'
  | 'guest.delete'
  | 'invitation.view'
  | 'invitation.create'
  | 'invitation.update'
  | 'quotation.view'
  | 'quotation.create'
  | 'quotation.update'
  | 'booking.view'
  | 'booking.create'
  | 'booking.update'
  | 'payment.view'
  | 'payment.manage'
  | 'budget.view'
  | 'budget.manage'
  | 'task.manage';

export type CreateWorkspaceInvitation = {
  email: string;
  role: Exclude<WorkspaceMemberRole, 'owner'>;
  permissions: WorkspacePermission[];
};

export const workspaceApi = {
  async listMembers(): Promise<WorkspaceMember[]> {
    const response = await apiClient.get<WorkspaceMember[]>('/workspace/members');
    return response.data;
  },
  async invite(input: CreateWorkspaceInvitation): Promise<{
    id: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    acceptanceToken: string;
  }> {
    const response = await apiClient.post<{
      id: string;
      email: string;
      role: string;
      status: string;
      expiresAt: string;
      acceptanceToken: string;
    }>('/workspace/invitations', input);
    return response.data;
  },
  async acceptInvitation(
    token: string,
    account?: { name: string; password: string },
  ): Promise<{ membership: WorkspaceMember; session: AuthSession }> {
    const response = await apiClient.post<{ membership: WorkspaceMember; session: AuthSession }>(
      '/workspace/invitations/accept',
      { token, ...account },
    );
    return response.data;
  },
  async updateMember(
    id: string,
    input: { role?: Exclude<WorkspaceMemberRole, 'owner'>; permissions?: WorkspacePermission[] },
  ): Promise<WorkspaceMember> {
    const response = await apiClient.patch(`/workspace/members/${encodeURIComponent(id)}`, input);
    return response.data;
  },
  async removeMember(id: string): Promise<void> {
    await apiClient.delete(`/workspace/members/${encodeURIComponent(id)}`);
  },
};
