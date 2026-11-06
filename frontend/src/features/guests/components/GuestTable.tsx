import { DataTable, type DataColumn } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import type { Guest } from '../../../types/guest.types';
const columns: DataColumn<Guest>[] = [
  { key: 'name', header: 'Guest', render: (guest) => guest.name },
  { key: 'email', header: 'Email', render: (guest) => guest.email ?? '—' },
  { key: 'group', header: 'Group', render: (guest) => guest.group ?? '—' },
  { key: 'rsvpStatus', header: 'RSVP', render: (guest) => <StatusBadge status={guest.rsvpStatus} /> },
];
export function GuestTable({ guests }: { guests: Guest[] }) {
  return <DataTable columns={columns} rows={guests} rowKey={(guest) => guest.id} />;
}
