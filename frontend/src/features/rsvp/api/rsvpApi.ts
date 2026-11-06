import { apiClient } from '../../../services/api/apiClient';
import type { RSVPResponse } from '../../../types/rsvp.types';

export const rsvpApi = {
  async submit(response: RSVPResponse): Promise<void> {
    await apiClient.post('/rsvp', response);
  },
  async getByToken(token: string): Promise<RSVPResponse> {
    const result = await apiClient.get<RSVPResponse>(`/rsvp/${encodeURIComponent(token)}`);
    return result.data;
  },
};
