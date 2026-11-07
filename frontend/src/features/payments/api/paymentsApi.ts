import { apiClient } from '../../../services/api/apiClient';
import type { Payment } from '../../../types/payment.types';

export type PaymentCheckout = {
  provider: 'razorpay';
  keyId: string;
  orderId: string;
  paymentId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
};

export type RazorpayVerification = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export const paymentsApi = {
  async list(): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>('/payments');
    return response.data;
  },
  async createCheckout(bookingId: string): Promise<PaymentCheckout> {
    const response = await apiClient.post<PaymentCheckout>('/payments/checkout', { bookingId });
    return response.data;
  },
  async verifyCheckout(input: RazorpayVerification): Promise<Payment> {
    const response = await apiClient.post<Payment>('/payments/verify', input);
    return response.data;
  },
};
