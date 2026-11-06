import { apiClient } from '../../../services/api/apiClient';
import type { Payment } from '../../../types/payment.types';

export const paymentsApi = {
  async list(): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>('/payments');
    return response.data;
  },
  async createCheckout(bookingId: string): Promise<{ checkoutUrl: string }> {
    const response = await apiClient.post<{ checkoutUrl: string }>('/payments/checkout', { bookingId });
    return response.data;
  },
};
