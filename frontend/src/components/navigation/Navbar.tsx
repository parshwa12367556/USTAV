
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogoS, User, Phone, Mail } from "lucide-react";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { to: ROUTES.public.home, label: "Home" },
  { to: ROUTES.public.venues, label: "Explore Venues" },
  { to: ROUTES.public.vendors, label: "Find Vendors" },
  { to: ROUTES.public.invitations, label: "Invitations" },
  { to: ROUTES.public.howItWorks, label: "How It Works" },
  { to: ROUTES.public.about, label: "About Us" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 md:px-8 lg:px-12">
        <Link to={ROUTES.public.home} className="flex items-center gap-2 text-2xl font-serif font-bold text-burgundy">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-gold-foreground text-xs font-bold">U</span>
          <span className="tracking-tight">UTSAV</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-burgundy transition-colors">{l.label}</Link>
          ))}
          <Link to={ROUTES.auth.login} className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted">Login</Link>
          <Link to={ROUTES.auth.register} className="px-5 py-2 rounded-md bg-burgundy text-white font-medium hover:bg-deep-burgundy transition-colors">Get Started</Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <button onClick={() => setOpen(!open)} className="p-2 rounded-md hover:bg-muted">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background p-4">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg hover:bg-muted text-sm font-medium">{l.label}</Link>
          ))}
          <div className="mt-4 pt-4 border-t border-border">
            <Link to={ROUTES.auth.login} className="block px-4 py-2 rounded-lg hover:bg-muted text-sm font-medium">Login</Link>
            <Link to={ROUTES.auth.register} className="block mt-2 px-4 py-2 rounded-lg bg-burgundy text-white text-sm font-center text-center font-medium">Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

