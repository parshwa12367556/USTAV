import { DataTable, type DataColumn } from '../../../components/tables/DataTable';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import type { Payment } from '../../../types/payment.types';
const columns: DataColumn<Payment>[] = [
  { key: 'invoiceNumber', header: 'Invoice', render: (item) => item.invoiceNumber },
  { key: 'amount', header: 'Amount', render: (item) => formatCurrency(item.amount) },
  { key: 'status', header: 'Status', render: (item) => item.status },
  { key: 'paidAt', header: 'Date', render: (item) => item.paidAt ? formatDate(item.paidAt) : '—' },
];
export function PaymentHistoryTable({ payments }: { payments: Payment[] }) {
  return <DataTable columns={columns} rows={payments} rowKey={(item) => item.id} />;
}
