
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";
import { Mail, Phone, Instagram, Facebook, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-deep-burgundy text-secondary">
      <div className="px-4 py-10 md:px-8 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h3 className="text-white font-serif font-semibold text-lg mb-4">About UTSAV</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Every Celebration, One Place. UTSAV helps families plan weddings and celebrations with trusted vendors, beautiful invitations and seamless guest management.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to={ROUTES.public.venues} className="hover:text-white">Wedding Venues</Link></li>
              <li><Link to={ROUTES.public.vendors} className="hover:text-white">Catering</Link></li>
              <li><Link to={ROUTES.public.vendors} className="hover:text-white">Decoration</Link></li>
              <li><Link to={ROUTES.public.invitations} className="hover:text-white">Invitations</Link></li>
              <li><Link to={ROUTES.public.vendors} className="hover:text-white">Event Management</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Help Centre</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to={ROUTES.public.about} className="hover:text-white">How It Works</Link></li>
              <li><a href="#" className="hover:text-white">Vendor Registration</a></li>
              <li><Link to={ROUTES.public.contact} className="hover:text-white">Contact Us</Link></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3"><Mail className="mt-1 h-5 w-5 flex-shrink-0" /><span>hello@utsav.in</span></li>
              <li className="flex items-start gap-3"><Phone className="mt-1 h-5 w-5 flex-shrink-0" /><span>+91 22 1234 5678</span></li>
              <li className="flex items-start gap-3"><span>Mumbai, Maharashtra, India</span></li>
            </ul>
            <div className="mt-6 flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-gold hover:text-gold-foreground transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-gold hover:text-gold-foreground transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-gold hover:text-gold-foreground transition-colors"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <span> {new Date().getFullYear()} UTSAV. All rights reserved.</span>
          <span>Demonstration platform  sample data only.</span>
        </div>
      </div>
    </footer>
  );
}

