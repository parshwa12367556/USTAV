import { apiClient } from '../../../services/api/apiClient';
import type { Booking } from '../../../types/booking.types';

export const bookingsApi = {
  async list(eventId?: string): Promise<Booking[]> {
    const response = await apiClient.get<Booking[]>('/bookings', { params: eventId ? { eventId } : undefined });
    return response.data;
  },
  async create(input: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> {
    const response = await apiClient.post<Booking>('/bookings', input);
    return response.data;
  },
  async cancel(id: string): Promise<void> {
    await apiClient.delete(`/bookings/${encodeURIComponent(id)}`);
  },
};
