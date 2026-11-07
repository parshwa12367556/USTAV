import { apiClient } from '../../../services/api/apiClient';
import type { Vendor } from '../../../types/vendor.types';

export type VendorFilters = { category?: string; city?: string; search?: string };

export const vendorsApi = {
  async list(filters: VendorFilters = {}): Promise<Vendor[]> {
    const response = await apiClient.get<Vendor[]>('/vendors', { params: filters });
    return response.data;
  },
  async get(id: string): Promise<Vendor> {
    const response = await apiClient.get<Vendor>(`/vendors/${encodeURIComponent(id)}`);
    return response.data;
  },
  async getMyProfile(): Promise<Vendor> {
    const response = await apiClient.get<Vendor>('/vendors/profile/me');
    return response.data;
  },
  async updateMyProfile(input: Partial<Pick<Vendor, 'name' | 'category' | 'city' | 'startingPrice' | 'description'>>): Promise<Vendor> {
    const response = await apiClient.patch<Vendor>('/vendors/profile/me', input);
    return response.data;
  },
  async createMyProfile(input: Pick<Vendor, 'name' | 'category' | 'city'> & Partial<Pick<Vendor, 'startingPrice' | 'description'>>): Promise<Vendor> {
    const response = await apiClient.post<Vendor>('/vendors/profile', input);
    return response.data;
  },
};
