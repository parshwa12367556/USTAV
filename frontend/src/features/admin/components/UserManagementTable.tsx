import { DataTable, type DataColumn } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import type { User } from '../../../types/user.types';
const columns: DataColumn<User>[] = [
  { key: 'name', header: 'Name', render: (user) => user.name },
  { key: 'email', header: 'Email', render: (user) => user.email },
  { key: 'role', header: 'Role', render: (user) => user.role },
  { key: 'status', header: 'Status', render: (user) => <StatusBadge status={user.status} /> },
];
export function UserManagementTable({ users }: { users: User[] }) {
  return <DataTable columns={columns} rows={users} rowKey={(user) => user.id} />;
}
