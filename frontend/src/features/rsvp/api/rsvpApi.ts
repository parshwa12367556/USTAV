import { apiClient } from '../../../services/api/apiClient';
import type { RSVPResponse } from '../../../types/rsvp.types';

export type GuestInvitation = {
  guestName: string;
  event: { name: string; date: string; location?: string | null };
  status: RSVPResponse['status'] | 'pending';
  functions: Array<{
    id: string;
    name: string;
    date: string;
    venue?: string | null;
    status: RSVPResponse['status'] | 'pending';
  }>;
};

export const rsvpApi = {
  async submit(response: RSVPResponse): Promise<void> {
    const { guestId: _guestId, ...payload } = response;
    await apiClient.post('/rsvp', payload);
  },
  async getByToken(token: string): Promise<GuestInvitation> {
    const result = await apiClient.get<GuestInvitation>(`/rsvp/${encodeURIComponent(token)}`);
    return result.data;
  },
};
