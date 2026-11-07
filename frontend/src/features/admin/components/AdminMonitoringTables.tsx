import { DataTable, type DataColumn } from '../../../components/tables/DataTable';
import { formatCurrency } from '../../../utils/formatCurrency';
import type { AdminDashboard } from '../api/adminApi';

type AdminBookingRow = AdminDashboard['recentBookings'][number];
type AdminPaymentRow = AdminDashboard['recentPayments'][number];

const bookingColumns: DataColumn<AdminBookingRow>[] = [
  { key: 'eventName', header: 'Event', render: (row) => row.eventName },
  { key: 'vendorName', header: 'Vendor', render: (row) => row.vendorName },
  { key: 'serviceName', header: 'Service', render: (row) => row.serviceName },
  { key: 'eventDate', header: 'Event date', render: (row) => row.eventDate },
  { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
  { key: 'status', header: 'Status', render: (row) => row.status },
];

const paymentColumns: DataColumn<AdminPaymentRow>[] = [
  { key: 'invoiceNumber', header: 'Invoice', render: (row) => row.invoiceNumber },
  { key: 'eventName', header: 'Event', render: (row) => row.eventName ?? 'Booking unavailable' },
  { key: 'serviceName', header: 'Service', render: (row) => row.serviceName ?? '—' },
  { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount, row.currency) },
  { key: 'status', header: 'Status', render: (row) => row.status },
  {
    key: 'createdAt',
    header: 'Created',
    render: (row) => new Date(row.createdAt).toLocaleString('en-IN'),
  },
];

export function AdminMonitoringTables({
  bookings,
  payments,
}: {
  bookings: AdminDashboard['recentBookings'];
  payments: AdminDashboard['recentPayments'];
}) {
  return (
    <div className="screen-stack">
      <section className="content-card admin-review-card">
        <div className="list-toolbar">
          <div>
            <h3>Recent bookings</h3>
            <p className="section-description">Latest booking activity across the platform.</p>
          </div>
        </div>
        <DataTable
          columns={bookingColumns}
          rows={bookings}
          rowKey={(row) => row.id}
          emptyMessage="No bookings have been created yet."
        />
      </section>
      <section className="content-card admin-review-card">
        <div className="list-toolbar">
          <div>
            <h3>Recent payments</h3>
            <p className="section-description">Latest payment records and their current status.</p>
          </div>
        </div>
        <DataTable
          columns={paymentColumns}
          rows={payments}
          rowKey={(row) => row.id}
          emptyMessage="No payments have been recorded yet."
        />
      </section>
    </div>
  );
}
