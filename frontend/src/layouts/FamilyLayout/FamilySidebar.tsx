import { NavLink } from 'react-router-dom';
const links = [['Overview', '/'], ['Events', '/events'], ['Guests', '/guests'], ['Invitations', '/invitations'], ['Vendors', '/vendors'], ['Budget', '/budget'], ['Bookings', '/bookings'], ['Settings', '/settings']];
export function FamilySidebar() {
  return <aside className="family-sidebar"><strong>Utsav</strong><nav aria-label="Family">{links.map(([label, to]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav></aside>;
}
