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
};
