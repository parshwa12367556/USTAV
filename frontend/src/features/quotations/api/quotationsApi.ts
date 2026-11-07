import { apiClient } from '../../../services/api/apiClient';
import type { Quotation } from '../../../types/quotation.types';

export const quotationsApi = {
  async list(eventId?: string): Promise<Quotation[]> {
    const response = await apiClient.get<Quotation[]>('/quotations', { params: eventId ? { eventId } : undefined });
    return response.data;
  },
  async create(input: Omit<Quotation, 'id' | 'status'>): Promise<Quotation> {
    const response = await apiClient.post<Quotation>('/quotations', input);
    return response.data;
  },
  async updateStatus(id: string, status: Quotation['status']): Promise<Quotation> {
    const response = await apiClient.patch<Quotation>(`/quotations/${encodeURIComponent(id)}`, { status });
    return response.data;
  },
  async sendVendorReply(
    id: string,
    input: {
      title: string;
      items: Array<{ description: string; quantity: number; unitPrice: number }>;
      validUntil?: string;
    },
  ): Promise<Quotation> {
    const response = await apiClient.patch<Quotation>(`/quotations/${encodeURIComponent(id)}`, {
      ...input,
      status: 'sent',
    });
    return response.data;
  },
};
