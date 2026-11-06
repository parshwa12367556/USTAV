import { apiClient } from '../../../services/api/apiClient';
import type { Vendor } from '../../../types/vendor.types';

export type CateringMenu = { id: string; name: string; pricePerPlate: number; description?: string };

export const cateringApi = {
  async listCaterers(city?: string): Promise<Vendor[]> {
    const response = await apiClient.get<Vendor[]>('/vendors', { params: { category: 'catering', city } });
    return response.data;
  },
  async listMenus(vendorId: string): Promise<CateringMenu[]> {
    const response = await apiClient.get<CateringMenu[]>(`/vendors/${encodeURIComponent(vendorId)}/menus`);
    return response.data;
  },
};
