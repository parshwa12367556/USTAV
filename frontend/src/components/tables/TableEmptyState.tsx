export function TableEmptyState({ message = 'Nothing to show yet.' }: { message?: string }) {
  return <div className="table-empty-state" role="status">{message}</div>;
}
