
import * as React from "react";
import { cn } from "@/utils/cn";

export interface TableProps {
  columns: { key: string; header: string; align?: "left" | "center" | "right" }[];
  data: Record<string, any>[];
  rowKey?: string;
  renderCell?: (value: any, row: Record<string, any>, col: string) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export function DataTable({ columns, data, rowKey = "id", renderCell, className, emptyMessage = "No records found." }: TableProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border bg-card", className)}>
        <div className="p-8 text-center text-muted-foreground">{emptyMessage}</div>
      </div>
    );
  }
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      <table className="w-full text-sm text-left">
        <thead className="bg-muted">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium text-foreground text-left">
                {col.header}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr key={row[rowKey]} className="hover:bg-muted/50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-4">
                  {renderCell ? renderCell(row[col.key], row, col.key) : String(row[col.key] || "")}
                </td>
              ))}
              <td className="px-4 py-4 text-right">{/* actions injected by parent via renderCell last column or slot */}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

