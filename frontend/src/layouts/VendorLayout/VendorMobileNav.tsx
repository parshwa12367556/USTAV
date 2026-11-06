import { NavLink } from 'react-router-dom';
const items = [{ to: '/vendor', label: 'Home' }, { to: '/vendor/quotation-requests', label: 'Enquiries' }, { to: '/vendor/bookings', label: 'Bookings' }, { to: '/vendor/settings', label: 'Settings' }];
export function VendorMobileNav() {
  return <nav className="mobile-nav" aria-label="Vendor navigation">{items.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/vendor'}>{item.label}</NavLink>)}</nav>;
}
