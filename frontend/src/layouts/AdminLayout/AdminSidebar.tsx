import { NavLink } from 'react-router-dom';
const links = [
  ['Overview', '/admin'], ['Users', '/admin/users'], ['Families', '/admin/families'],
  ['Vendors', '/admin/vendors'], ['Verification', '/admin/vendor-verification'],
  ['Templates', '/admin/templates'], ['Bookings', '/admin/bookings'], ['Audit log', '/admin/audit-logs'],
];
export function AdminSidebar() {
  return <aside className="admin-sidebar"><strong>Utsav Admin</strong><nav aria-label="Admin">{links.map(([label, to]) => <NavLink key={to} to={to} end={to === '/admin'}>{label}</NavLink>)}</nav></aside>;
}
