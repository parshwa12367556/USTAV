import { DataTable, type DataColumn } from '../../../components/tables/DataTable';
export type AuditLogEntry = { id: string; actor: string; action: string; target: string; createdAt: string };
const columns: DataColumn<AuditLogEntry>[] = [
  { key: 'actor', header: 'User', render: (row) => row.actor },
  { key: 'action', header: 'Action', render: (row) => row.action },
  { key: 'target', header: 'Target', render: (row) => row.target },
  { key: 'createdAt', header: 'Date', render: (row) => new Date(row.createdAt).toLocaleString() },
];
export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  return <DataTable columns={columns} rows={entries} rowKey={(row) => row.id} />;
}
