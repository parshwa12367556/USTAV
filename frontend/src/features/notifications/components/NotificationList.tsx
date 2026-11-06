export type NotificationItem = { id: string; title: string; message: string; createdAt: string; read: boolean };
export function NotificationList({ items, onRead }: { items: NotificationItem[]; onRead?: (id: string) => void }) {
  return <ul className="notification-list">{items.map((item) => <li key={item.id} className={item.read ? '' : 'is-unread'}>
    <button type="button" onClick={() => onRead?.(item.id)}><strong>{item.title}</strong><span>{item.message}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></button>
  </li>)}</ul>;
}
