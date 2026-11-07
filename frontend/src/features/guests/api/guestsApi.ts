import { apiClient } from '../../../services/api/apiClient';
import type { Guest } from '../../../types/guest.types';

export type CreateGuestInput = Pick<Guest, 'name'> &
  Partial<Pick<Guest, 'email' | 'phone' | 'group' | 'plusOnes'>>;

export const guestsApi = {
  async list(eventId: string): Promise<Guest[]> {
    const response = await apiClient.get<Guest[]>(
      `/events/${encodeURIComponent(eventId)}/guests`,
    );
    return response.data;
  },
  async create(eventId: string, input: CreateGuestInput): Promise<Guest> {
    const response = await apiClient.post<Guest>(
      `/events/${encodeURIComponent(eventId)}/guests`,
      input,
    );
    return response.data;
  },
  async update(id: string, input: Partial<CreateGuestInput>): Promise<Guest> {
    const response = await apiClient.patch<Guest>(`/guests/${encodeURIComponent(id)}`, input);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/guests/${encodeURIComponent(id)}`);
  },
  async rotateInvitationToken(id: string): Promise<{ guestId: string; invitationToken: string; expiresAt: string }> {
    const response = await apiClient.post<{ guestId: string; invitationToken: string; expiresAt: string }>(
      `/guests/${encodeURIComponent(id)}/invitation-token/rotate`,
    );
    return response.data;
  },
  async importCsv(eventId: string, file: File): Promise<{ imported: number; guests: Guest[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ imported: number; guests: Guest[] }>(
      `/events/${encodeURIComponent(eventId)}/guests/import-csv`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },
};
