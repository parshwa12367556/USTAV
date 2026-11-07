import { DataTable, type DataColumn } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import type { AdminUser } from '../api/adminApi';

export function UserManagementTable({
  users,
  currentUserId,
  updatingUserId,
  onToggleStatus,
}: {
  users: AdminUser[];
  currentUserId: string;
  updatingUserId: string;
  onToggleStatus: (user: AdminUser) => void;
}) {
  const columns: DataColumn<AdminUser>[] = [
    { key: 'name', header: 'Name', render: (user) => user.name },
    { key: 'email', header: 'Email', render: (user) => user.email },
    { key: 'role', header: 'Role', render: (user) => user.role },
    { key: 'status', header: 'Status', render: (user) => <StatusBadge status={user.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => user.id === currentUserId
        ? 'Current administrator'
        : <button
          type="button"
          className="button button--outline"
          disabled={updatingUserId === user.id}
          onClick={() => onToggleStatus(user)}
        >
          {updatingUserId === user.id
            ? 'Saving…'
            : user.status === 'active' ? 'Suspend account' : 'Reactivate account'}
        </button>,
    },
  ];
  return <DataTable columns={columns} rows={users} rowKey={(user) => user.id} />;
}
