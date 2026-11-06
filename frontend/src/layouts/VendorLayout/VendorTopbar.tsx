import { useLocation } from 'react-router-dom';
export function VendorTopbar({ title }: { title?: string }) {
  const location = useLocation();
  return <header className="vendor-topbar"><h1>{title ?? location.pathname.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ') ?? 'Overview'}</h1><span>Your business, beautifully organized</span></header>;
}
