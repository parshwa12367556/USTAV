import { apiClient } from '../../../services/api/apiClient';
import type { CreateEventInput, Event } from '../../../types/event.types';

export const eventsApi = {
  async list(): Promise<Event[]> {
    const response = await apiClient.get<Event[]>('/events');
    return response.data;
  },
  async create(input: CreateEventInput): Promise<Event> {
    const response = await apiClient.post<Event>('/events', input);
    return response.data;
  },
};
