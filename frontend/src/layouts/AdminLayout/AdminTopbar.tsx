import { useLocation } from 'react-router-dom';
export function AdminTopbar({ title }: { title?: string }) {
  const location = useLocation();
  return <header className="admin-topbar"><strong>{title ?? (location.pathname.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ') || 'Overview')}</strong><span>Administrator workspace</span></header>;
}
