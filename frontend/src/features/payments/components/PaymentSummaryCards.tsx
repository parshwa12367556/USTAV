import type { Payment } from '../../../types/payment.types';
import { formatCurrency } from '../../../utils/formatCurrency';
export function PaymentSummaryCards({ payments }: { payments: Payment[] }) {
  const paid = payments.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);
  const pending = payments.filter((item) => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0);
  return <div className="payment-summary"><article><span>Paid</span><strong>{formatCurrency(paid)}</strong></article><article><span>Pending</span><strong>{formatCurrency(pending)}</strong></article></div>;
}
