import { apiClient } from '../../../services/api/apiClient';

export type EventFunction = {
  id: string;
  eventId: string;
  name: string;
  date: string;
  venue?: string;
  guestCount: number;
  notes?: string;
};

export type EventFunctionInput = Pick<EventFunction, 'name' | 'date'> &
  Partial<Pick<EventFunction, 'venue' | 'guestCount' | 'notes'>>;

export const functionsApi = {
  async list(eventId: string): Promise<EventFunction[]> {
    const response = await apiClient.get<EventFunction[]>(
      `/events/${encodeURIComponent(eventId)}/functions`,
    );
    return response.data;
  },
  async create(eventId: string, input: EventFunctionInput): Promise<EventFunction> {
    const response = await apiClient.post<EventFunction>(
      `/events/${encodeURIComponent(eventId)}/functions`,
      input,
    );
    return response.data;
  },
  async update(id: string, input: Partial<EventFunctionInput>): Promise<EventFunction> {
    const response = await apiClient.patch<EventFunction>(
      `/functions/${encodeURIComponent(id)}`,
      input,
    );
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/functions/${encodeURIComponent(id)}`);
  },
};
