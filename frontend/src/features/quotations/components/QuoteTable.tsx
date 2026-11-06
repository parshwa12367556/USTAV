import { DataTable, type DataColumn } from '../../../components/tables/DataTable';
import type { Quotation } from '../../../types/quotation.types';
import { StatusBadge } from '../../../components/common/StatusBadge';
const columns: DataColumn<Quotation>[] = [
  { key: 'title', header: 'Quotation', render: (item) => item.title },
  { key: 'vendorId', header: 'Vendor', render: (item) => item.vendorId },
  { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
];
export function QuoteTable({ quotes }: { quotes: Quotation[] }) {
  return <DataTable columns={columns} rows={quotes} rowKey={(item) => item.id} />;
}
