export function NotificationBell({ count, onClick }: { count: number; onClick: () => void }) {
  return <button type="button" className="notification-bell" aria-label={`${count} unread notifications`} onClick={onClick}>
    <span aria-hidden="true">♧</span>{count > 0 && <span className="notification-count">{count > 99 ? '99+' : count}</span>}
  </button>;
}
