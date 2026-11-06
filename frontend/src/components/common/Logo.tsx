import { Link } from 'react-router-dom';

export function Logo({ to = '/', compact = false }: { to?: string; compact?: boolean }) {
  return <Link className={`brand ${compact ? 'brand--compact' : ''}`} to={to} aria-label="Utsav home">
    <span className="brand-mark" aria-hidden="true">u</span>{!compact && <span className="brand-word">utsav<span>.</span></span>}
  </Link>;
}
