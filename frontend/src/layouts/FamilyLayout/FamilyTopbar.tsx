import { useLocation } from 'react-router-dom';
export function FamilyTopbar({ title }: { title?: string }) {
  const location = useLocation();
  const pageTitle = title ?? location.pathname.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ') ?? 'Overview';
  return <header className="family-topbar"><h1>{pageTitle}</h1><span>Sharma family workspace</span></header>;
}
