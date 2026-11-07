import { apiClient } from '../../../services/api/apiClient';

export type VendorService = {
  id: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
};

export type VendorPackage = {
  id: string;
  name: string;
  description?: string;
  price: number;
  inclusions: string[];
  isActive: boolean;
};

export type PortfolioItem = {
  id: string;
  imageUrl: string;
  caption?: string;
};

export type VendorAvailability = {
  id: string;
  date: string;
  isAvailable: boolean;
  note?: string;
};

export const vendorManagementApi = {
  async listServices(): Promise<VendorService[]> {
    const response = await apiClient.get<VendorService[]>('/vendors/profile/me/services');
    return response.data;
  },
  async createService(input: Omit<VendorService, 'id'>): Promise<VendorService> {
    const response = await apiClient.post<VendorService>('/vendors/profile/me/services', input);
    return response.data;
  },
  async updateService(id: string, input: Partial<Omit<VendorService, 'id'>>): Promise<VendorService> {
    const response = await apiClient.patch<VendorService>(`/vendors/services/${encodeURIComponent(id)}`, input);
    return response.data;
  },
  async deleteService(id: string): Promise<void> {
    await apiClient.delete(`/vendors/services/${encodeURIComponent(id)}`);
  },
  async listPackages(): Promise<VendorPackage[]> {
    const response = await apiClient.get<VendorPackage[]>('/vendors/profile/me/packages');
    return response.data;
  },
  async createPackage(input: Omit<VendorPackage, 'id'>): Promise<VendorPackage> {
    const response = await apiClient.post<VendorPackage>('/vendors/profile/me/packages', input);
    return response.data;
  },
  async updatePackage(id: string, input: Partial<Omit<VendorPackage, 'id'>>): Promise<VendorPackage> {
    const response = await apiClient.patch<VendorPackage>(`/vendors/packages/${encodeURIComponent(id)}`, input);
    return response.data;
  },
  async deletePackage(id: string): Promise<void> {
    await apiClient.delete(`/vendors/packages/${encodeURIComponent(id)}`);
  },
  async listPortfolio(): Promise<PortfolioItem[]> {
    const response = await apiClient.get<PortfolioItem[]>('/vendors/profile/me/portfolio');
    return response.data;
  },
  async createPortfolioItem(input: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> {
    const response = await apiClient.post<PortfolioItem>('/vendors/profile/me/portfolio', input);
    return response.data;
  },
  async deletePortfolioItem(id: string): Promise<void> {
    await apiClient.delete(`/vendors/portfolio/${encodeURIComponent(id)}`);
  },
  async listAvailability(): Promise<VendorAvailability[]> {
    const response = await apiClient.get<VendorAvailability[]>('/vendors/profile/me/availability');
    return response.data;
  },
  async setAvailability(input: Pick<VendorAvailability, 'date' | 'isAvailable'> & { note?: string }): Promise<VendorAvailability> {
    const response = await apiClient.put<VendorAvailability>('/vendors/profile/me/availability', input);
    return response.data;
  },
  async deleteAvailability(id: string): Promise<void> {
    await apiClient.delete(`/vendors/profile/me/availability/${encodeURIComponent(id)}`);
  },
};
