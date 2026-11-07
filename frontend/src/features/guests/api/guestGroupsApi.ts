import { apiClient } from '../../../services/api/apiClient';

export type GuestGroup = {
  id: string;
  name: string;
  guestCount: number;
};

export const guestGroupsApi = {
  async list(eventId: string): Promise<GuestGroup[]> {
    const response = await apiClient.get<GuestGroup[]>(
      `/events/${encodeURIComponent(eventId)}/guest-groups`,
    );
    return response.data;
  },
  async create(eventId: string, name: string): Promise<GuestGroup> {
    const response = await apiClient.post<GuestGroup>(
      `/events/${encodeURIComponent(eventId)}/guest-groups`,
      { name },
    );
    return response.data;
  },
  async update(id: string, name: string): Promise<GuestGroup> {
    const response = await apiClient.patch<GuestGroup>(
      `/guest-groups/${encodeURIComponent(id)}`,
      { name },
    );
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/guest-groups/${encodeURIComponent(id)}`);
  },
};
