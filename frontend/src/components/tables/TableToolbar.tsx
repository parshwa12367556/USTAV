import type { ReactNode } from 'react';

export function TableToolbar({ search, onSearch, children }: { search?: string; onSearch?: (value: string) => void; children?: ReactNode }) {
  return <div className="table-toolbar">
    {onSearch && <input type="search" aria-label="Search table" placeholder="Search…" value={search ?? ''} onChange={(event) => onSearch(event.currentTarget.value)} />}
    {children}
  </div>;
}
