import type { Payment } from '../../../types/payment.types';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
export function InvoiceView({ payment }: { payment: Payment }) {
  return <article className="invoice-view"><header><h2>Invoice {payment.invoiceNumber}</h2><span>{payment.status}</span></header>
    <p>Issued by Utsav</p><dl><dt>Amount due</dt><dd>{formatCurrency(payment.amount)}</dd><dt>Status</dt><dd>{payment.status}</dd>{payment.paidAt && <><dt>Paid on</dt><dd>{formatDate(payment.paidAt)}</dd></>}</dl>
  </article>;
}
