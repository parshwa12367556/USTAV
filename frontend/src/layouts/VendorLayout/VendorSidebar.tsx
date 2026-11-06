import { NavLink } from 'react-router-dom';
const links = [['Overview', '/vendor'], ['Profile', '/vendor/profile'], ['Enquiries', '/vendor/quotation-requests'], ['Services', '/vendor/services'], ['Portfolio', '/vendor/portfolio'], ['Bookings', '/vendor/bookings'], ['Payments', '/vendor/payments'], ['Settings', '/vendor/settings']];
export function VendorSidebar() {
  return <aside className="vendor-sidebar"><strong>Vendor studio</strong><nav aria-label="Vendor studio">{links.map(([label, to]) => <NavLink key={to} to={to} end={to === '/vendor'}>{label}</NavLink>)}</nav></aside>;
}
