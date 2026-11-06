import { Link } from 'react-router-dom';
export function PublicFooter() {
  return <footer className="public-footer"><span>© {new Date().getFullYear()} Utsav</span><nav aria-label="Footer"><Link to="/about">About</Link><Link to="/services">Services</Link><Link to="/contact">Contact</Link></nav></footer>;
}
