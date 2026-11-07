import { apiClient } from '../../../services/api/apiClient';

export type InvitationTemplate = {
  id: string;
  name: string;
  category: string;
  previewUrl?: string;
  price: number;
};

export type UserInvitation = {
  id: string;
  eventId: string;
  templateId: string;
  title: string;
  status: 'draft' | 'published';
  design: Record<string, unknown>;
  shareToken?: string;
};

export const invitationsApi = {
  async listTemplates(): Promise<InvitationTemplate[]> {
    const response = await apiClient.get<InvitationTemplate[]>('/invitations/templates');
    return response.data;
  },
  async list(): Promise<UserInvitation[]> {
    const response = await apiClient.get<UserInvitation[]>('/invitations');
    return response.data;
  },
  async create(input: Omit<UserInvitation, 'id' | 'shareToken'>): Promise<UserInvitation> {
    const response = await apiClient.post<UserInvitation>('/invitations', input);
    return response.data;
  },
  async update(id: string, input: Partial<Pick<UserInvitation, 'title' | 'status' | 'design'>>): Promise<UserInvitation> {
    const response = await apiClient.patch<UserInvitation>(
      `/invitations/${encodeURIComponent(id)}`,
      input,
    );
    return response.data;
  },
};
