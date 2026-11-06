import { apiClient } from '../../../services/api/apiClient';
import type { Venue } from '../../../types/venue.types';

export type VenueFilters = { city?: string; minCapacity?: number; maxPrice?: number };

export const venuesApi = {
  async list(filters: VenueFilters = {}): Promise<Venue[]> {
    const response = await apiClient.get<Venue[]>('/venues', { params: filters });
    return response.data;
  },
  async get(id: string): Promise<Venue> {
    const response = await apiClient.get<Venue>(`/venues/${encodeURIComponent(id)}`);
    return response.data;
  },
};
