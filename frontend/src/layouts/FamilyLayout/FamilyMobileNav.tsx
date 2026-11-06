import { NavLink } from 'react-router-dom';
const items = [{ to: '/', label: 'Home' }, { to: '/events', label: 'Events' }, { to: '/guests', label: 'Guests' }, { to: '/budget', label: 'Budget' }];
export function FamilyMobileNav() {
  return <nav className="mobile-nav" aria-label="Family navigation">{items.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'}>{item.label}</NavLink>)}</nav>;
}
