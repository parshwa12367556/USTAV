export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type Payment = {
  id: string;
  bookingId?: string;
  invoiceNumber: string;
  amount: number;
  currency: 'INR';
  status: PaymentStatus;
  paidAt?: string;
};
