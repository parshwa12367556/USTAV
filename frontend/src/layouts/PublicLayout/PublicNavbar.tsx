import { Link, NavLink } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
export function PublicNavbar() {
  return <header className="public-navbar"><Logo to="/home" /><nav aria-label="Main navigation">
    <NavLink to="/about">About</NavLink><NavLink to="/services">Services</NavLink><NavLink to="/explore/venues">Explore</NavLink>
  </nav><div><Link to="/login">Sign in</Link><Link className="button button--primary" to="/register">Get started</Link></div></header>;
}
