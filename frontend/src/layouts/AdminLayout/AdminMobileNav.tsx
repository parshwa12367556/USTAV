import { NavLink } from 'react-router-dom';
const items = [{ to: '/admin', label: 'Home' }, { to: '/admin/users', label: 'Users' }, { to: '/admin/vendors', label: 'Vendors' }, { to: '/admin/settings', label: 'Settings' }];
export function AdminMobileNav() {
  return <nav className="mobile-nav" aria-label="Admin navigation">{items.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/admin'}>{item.label}</NavLink>)}</nav>;
}
