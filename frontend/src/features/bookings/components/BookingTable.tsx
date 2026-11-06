import { DataTable, type DataColumn } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import type { Booking } from '../../../types/booking.types';
const columns: DataColumn<Booking>[] = [
  { key: 'serviceName', header: 'Service', render: (item) => item.serviceName },
  { key: 'eventDate', header: 'Event date', render: (item) => formatDate(item.eventDate) },
  { key: 'amount', header: 'Amount', render: (item) => formatCurrency(item.amount) },
  { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
];
export function BookingTable({ bookings }: { bookings: Booking[] }) {
  return <DataTable columns={columns} rows={bookings} rowKey={(item) => item.id} />;
}
