import type { ReactNode } from 'react';

export type DataColumn<T> = { key: string; header: string; render?: (row: T) => ReactNode; className?: string };
export function DataTable<T>({ columns, rows, rowKey, emptyMessage = 'No records found.' }: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  emptyMessage?: string;
}) {
  return <div className="data-table-wrap"><table className="data-table">
    <thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.header}</th>)}</tr></thead>
    <tbody>{rows.length ? rows.map((row, index) => <tr key={rowKey(row, index)}>
      {columns.map((column) => <td key={column.key} className={column.className}>{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}</td>)}
    </tr>) : <tr><td colSpan={columns.length}>{emptyMessage}</td></tr>}</tbody>
  </table></div>;
}
