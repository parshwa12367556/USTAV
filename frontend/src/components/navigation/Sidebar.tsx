
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dashboard, Calendar, Mail, Users, User, CheckCircle2, Clock, Building2, ShoppingBag, CreditCard, Scale, Bell, Settings, LogOut, ArrowRight, LayoutDashboard } from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const familyItems: NavItem[] = [
  { label: "Overview", to: "/family/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "My Events", to: "/family/events", icon: <Calendar className="h-5 w-5" /> },
  { label: "Invitations", to: "/family/invitations", icon: <Mail className="h-5 w-5" /> },
  { label: "Guest Management", to: "/family/guests", icon: <Users className="h-5 w-5" /> },
  { label: "RSVP Management", to: "/family/rsvp", icon: <CheckCircle2 className="h-5 w-5" /> },
  { label: "Find Venues", to: "/family/venues", icon: <Building2 className="h-5 w-5" /> },
  { label: "Catering", to: "/family/catering", icon: <ShoppingBag className="h-5 w-5" /> },
  { label: "Decoration", to: "/family/decoration", icon: <ShoppingBag className="h-5 w-5" /> },
  { label: "Event Management", to: "/family/event-management", icon: <Calendar className="h-5 w-5" /> },
  { label: "Vendors", to: "/family/vendors", icon: <Users className="h-5 w-5" /> },
  { label: "Quotations", to: "/family/quotations", icon: <Scale className="h-5 w-5" /> },
  { label: "My Bookings", to: "/family/bookings", icon: <Calendar className="h-5 w-5" /> },
  { label: "Payments", to: "/family/payments", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Budget", to: "/family/budget", icon: <Scale className="h-5 w-5" /> },
  { label: "Notifications", to: "/family/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: "Family Members", to: "/family/members", icon: <Users className="h-5 w-5" /> },
  { label: "Settings", to: "/family/settings", icon: <Settings className="h-5 w-5" /> },
];

const vendorItems: NavItem[] = [
  { label: "Overview", to: "/vendor/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Business Profile", to: "/vendor/profile", icon: <Building2 className="h-5 w-5" /> },
  { label: "Services", to: "/vendor/services", icon: <ShoppingBag className="h-5 w-5" /> },
  { label: "Packages", to: "/vendor/packages", icon: <PackageIcon /> },
  { label: "Portfolio", to: "/vendor/portfolio", icon: <ImageIcon /> },
  { label: "Availability", to: "/vendor/availability", icon: <Calendar className="h-5 w-5" /> },
  { label: "Quotation Requests", to: "/vendor/quotation-requests", icon: <Mail className="h-5 w-5" /> },
  { label: "My Quotations", to: "/vendor/quotations", icon: <Scale className="h-5 w-5" /> },
  { label: "Bookings", to: "/vendor/bookings", icon: <Calendar className="h-5 w-5" /> },
  { label: "Payments", to: "/vendor/payments", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Reviews", to: "/vendor/reviews", icon: <StarIcon /> },
  { label: "Analytics", to: "/vendor/analytics", icon: <BarIcon /> },
  { label: "Settings", to: "/vendor/settings", icon: <Settings className="h-5 w-5" /> },
];

const adminItems: NavItem[] = [
  { label: "Overview", to: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Users", to: "/admin/users", icon: <User className="h-5 w-5" /> },
  { label: "Families", to: "/admin/families", icon: <Users className="h-5 w-5" /> },
  { label: "Vendors", to: "/admin/vendors", icon: <Building2 className="h-5 w-5" /> },
  { label: "Vendor Verification", to: "/admin/vendor-verification", icon: <CheckCircle2 className="h-5 w-5" /> },
  { label: "Service Categories", to: "/admin/categories", icon: <TagIcon /> },
  { label: "Venues", to: "/admin/venues", icon: <Building2 className="h-5 w-5" /> },
  { label: "Invitation Templates", to: "/admin/templates", icon: <Mail className="h-5 w-5" /> },
  { label: "Bookings", to: "/admin/bookings", icon: <Calendar className="h-5 w-5" /> },
  { label: "Payments", to: "/admin/payments", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Commissions", to: "/admin/commissions", icon: <Scale className="h-5 w-5" /> },
  { label: "Reviews", to: "/admin/reviews", icon: <StarIcon /> },
  { label: "Reports", to: "/admin/reports", icon: <BarIcon /> },
  { label: "Audit Logs", to: "/admin/audit-logs", icon: <Clock className="h-5 w-5" /> },
  { label: "Platform Settings", to: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
];

function PackageIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function ImageIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function StarIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 6.253 8.967 8.245 7.5 11.063a17.54 17.54 0 001.5 2.907m-1.5 0C8.503 14.046 8.503 14.046 8.503 14.046a17.54 17.54 0 011.5-2.907m-1.5 0c1.467-2.818 3.333-4.81 4.5-6.818m0 0c1.167-2.008 3.083-3.67 4.5-6.818a17.54 17.54 0 011.5 2.907m-1.5 0c1.467-2.818 3.333-4.81 4.5-6.818m0 0c1.167-2.008 3.083-3.67 4.5-6.818a17.54 17.54 0 011.5 2.907m-1.5 0z" /></svg>; }
function BarIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>; }
function TagIcon() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0" /></svg>; }

interface SidebarProps {
  items: NavItem[];
  role: "family" | "vendor" | "admin";
}

export function Sidebar({ items, role }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-72 border-r border-border bg-background transform transition-transform duration-300 -translate-x-full md:translate-x-0">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 h-14 px-6 border-b border-border">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-gold-foreground text-xs font-bold">U</span>
          <span className="font-serif font-bold text-xl text-burgundy">UTSAV</span>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Main Navigation</div>
          {items.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive ? "bg-gold/10 text-burgundy font-semibold shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-border">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-foreground">{user?.fullName || "User"}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors">
            <LogOut className="h-5 w-5" /> <ArrowRight className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

