export function TablePagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return <nav className="table-pagination" aria-label="Table pages">
    <span>{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : '0 results'}</span>
    <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
    <span>Page {page} of {pageCount}</span>
    <button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Next</button>
  </nav>;
}
