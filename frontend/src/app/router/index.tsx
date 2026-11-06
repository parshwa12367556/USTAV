
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { FamilyLayout } from "@/layouts/FamilyLayout";
import { VendorLayout } from "@/layouts/VendorLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { GuestLayout } from "@/layouts/GuestLayout";
import { useAuth } from "@/hooks/useAuth";

const Home = React.lazy(() => import("@/pages/public/Home"));
const About = React.lazy(() => import("@/pages/public/About"));
const Services = React.lazy(() => import("@/pages/public/Services"));
const Contact = React.lazy(() => import("@/pages/public/Contact"));
const FAQ = React.lazy(() => import("@/pages/public/FAQ"));
const Pricing = React.lazy(() => import("@/pages/public/Pricing"));
const VenuesPage = React.lazy(() => import("@/pages/public/Venues"));
const VendorsPage = React.lazy(() => import("@/pages/public/Vendors"));
const InvitationsPage = React.lazy(() => import("@/pages/public/Invitations"));

const Login = React.lazy(() => import("@/pages/auth/Login"));
const Register = React.lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = React.lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("@/pages/auth/ResetPassword"));
const VerifyOTP = React.lazy(() => import("@/pages/auth/VerifyOTP"));
const Onboarding = React.lazy(() => import("@/pages/auth/Onboarding"));

const FamilyDashboard = React.lazy(() => import("@/pages/family/Dashboard"));
const MyEvents = React.lazy(() => import("@/pages/family/MyEvents"));
const CreateEvent = React.lazy(() => import("@/pages/family/CreateEvent"));
const EventDetails = React.lazy(() => import("@/pages/family/EventDetails"));
const FamilyGuests = React.lazy(() => import("@/pages/family/Guests"));
const FamilyRSVP = React.lazy(() => import("@/pages/family/RSVP"));
const FamilyInvitations = React.lazy(() => import("@/pages/family/Invitations"));
const InvitationEditor = React.lazy(() => import("@/pages/family/InvitationEditor"));
const FamilyVenues = React.lazy(() => import("@/pages/family/Venues"));
const FamilyCatering = React.lazy(() => import("@/pages/family/Catering"));
const FamilyDecoration = React.lazy(() => import("@/pages/family/Decoration"));
const FamilyEventManagement = React.lazy(() => import("@/pages/family/EventManagement"));
const FamilyVendors = React.lazy(() => import("@/pages/family/Vendors"));
const FamilyQuotations = React.lazy(() => import("@/pages/family/Quotations"));
const FamilyBookings = React.lazy(() => import("@/pages/family/Bookings"));
const FamilyPayments = React.lazy(() => import("@/pages/family/Payments"));
const FamilyBudget = React.lazy(() => import("@/pages/family/Budget"));
const FamilyNotifications = React.lazy(() => import("@/pages/family/Notifications"));
const FamilyMembers = React.lazy(() => import("@/pages/family/Members"));
const FamilySettings = React.lazy(() => import("@/pages/family/Settings"));

const VendorDashboard = React.lazy(() => import("@/pages/vendor/Dashboard"));
const VendorProfile = React.lazy(() => import("@/pages/vendor/Profile"));
const VendorServices = React.lazy(() => import("@/pages/vendor/Services"));
const VendorPackages = React.lazy(() => import("@/pages/vendor/Packages"));
const VendorPortfolio = React.lazy(() => import("@/pages/vendor/Portfolio"));
const VendorAvailability = React.lazy(() => import("@/pages/vendor/Availability"));
const VendorQuotationRequests = React.lazy(() => import("@/pages/vendor/QuotationRequests"));
const VendorQuotations = React.lazy(() => import("@/pages/vendor/Quotations"));
const VendorBookings = React.lazy(() => import("@/pages/vendor/Bookings"));
const VendorPayments = React.lazy(() => import("@/pages/vendor/Payments"));
const VendorReviews = React.lazy(() => import("@/pages/vendor/Reviews"));
const VendorAnalytics = React.lazy(() => import("@/pages/vendor/Analytics"));
const VendorSettings = React.lazy(() => import("@/pages/vendor/Settings"));

const AdminDashboard = React.lazy(() => import("@/pages/admin/Dashboard"));
const AdminUsers = React.lazy(() => import("@/pages/admin/Users"));
const AdminFamilies = React.lazy(() => import("@/pages/admin/Families"));
const AdminVendors = React.lazy(() => import("@/pages/admin/Vendors"));
const AdminVendorVerification = React.lazy(() => import("@/pages/admin/VendorVerification"));
const AdminCategories = React.lazy(() => import("@/pages/admin/Categories"));
const AdminVenues = React.lazy(() => import("@/pages/admin/Venues"));
const AdminTemplates = React.lazy(() => import("@/pages/admin/Templates"));
const AdminBookings = React.lazy(() => import("@/pages/admin/Bookings"));
const AdminPayments = React.lazy(() => import("@/pages/admin/Payments"));
const AdminCommissions = React.lazy(() => import("@/pages/admin/Commissions"));
const AdminReviews = React.lazy(() => import("@/pages/admin/Reviews"));
const AdminReports = React.lazy(() => import("@/pages/admin/Reports"));
const AdminAuditLogs = React.lazy(() => import("@/pages/admin/AuditLogs"));
const AdminSettings = React.lazy(() => import("@/pages/admin/Settings"));

const GuestInvitationView = React.lazy(() => import("@/pages/guest/InvitationView"));
const GuestRSVPForm = React.lazy(() => import("@/pages/guest/RSVPForm"));
const GuestRSVPConfirmation = React.lazy(() => import("@/pages/guest/RSVPConfirmation"));

const requireAuth = (element: React.ComponentType) => {
  const Wrapped: React.FC = () => {
    const { user, isLoading } = useAuth();
    if (isLoading) return null;
    if (!user) return <Navigate to="/login" replace />;
    return <element />;
  };
  return Wrapped;
};

const requireRole = (element: React.ComponentType, allowed: string[]) => {
  const Wrapped: React.FC = () => {
    const { user, isLoading } = useAuth();
    if (isLoading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (!allowed.includes(user.role)) return <Navigate to="/" replace />;
    return <element />;
  };
  return Wrapped;
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLayout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "services", Component: Services },
      { path: "venues", Component: VenuesPage },
      { path: "venues/:venueId", Component: React.lazy(() => import("@/pages/public/VenueDetail")) },
      { path: "vendors", Component: VendorsPage },
      { path: "vendors/:vendorId", Component: React.lazy(() => import("@/pages/public/VendorDetail")) },
      { path: "invitations", Component: InvitationsPage },
      { path: "how-it-works", Component: React.lazy(() => import("@/pages/public/HowItWorks")) },
      { path: "contact", Component: Contact },
      { path: "faq", Component: FAQ },
      { path: "pricing", Component: Pricing },
    ],
  },
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password", Component: ResetPassword },
      { path: "verify-otp", Component: VerifyOTP },
      { path: "onboarding", Component: Onboarding },
    ],
  },
  {
    path: "/family",
    Component: requireAuth(FamilyLayout),
    children: [
      { index: true, Component: requireAuth(FamilyDashboard) },
      { path: "dashboard", Component: requireAuth(FamilyDashboard) },
      { path: "events", Component: requireAuth(MyEvents) },
      { path: "events/new", Component: requireAuth(CreateEvent) },
      { path: "events/:eventId", Component: requireAuth(EventDetails) },
      { path: "events/:eventId/functions", Component: requireAuth(React.lazy(() => import("@/pages/family/Functions"))) },
      { path: "invitations", Component: requireAuth(FamilyInvitations) },
      { path: "invitations/editor/:invitationId", Component: requireAuth(InvitationEditor) },
      { path: "guests", Component: requireAuth(FamilyGuests) },
      { path: "rsvp", Component: requireAuth(FamilyRSVP) },
      { path: "venues", Component: requireAuth(FamilyVenues) },
      { path: "catering", Component: requireAuth(FamilyCatering) },
      { path: "decoration", Component: requireAuth(FamilyDecoration) },
      { path: "event-management", Component: requireAuth(FamilyEventManagement) },
      { path: "vendors", Component: requireAuth(FamilyVendors) },
      { path: "quotations", Component: requireAuth(FamilyQuotations) },
      { path: "bookings", Component: requireAuth(FamilyBookings) },
      { path: "payments", Component: requireAuth(FamilyPayments) },
      { path: "budget", Component: requireAuth(FamilyBudget) },
      { path: "notifications", Component: requireAuth(FamilyNotifications) },
      { path: "members", Component: requireAuth(FamilyMembers) },
      { path: "settings", Component: requireAuth(FamilySettings) },
    ],
  },
  {
    path: "/vendor",
    Component: requireRole(VendorLayout, ["vendor"]),
    children: [
      { index: true, Component: requireRole(VendorDashboard, ["vendor"]) },
      { path: "dashboard", Component: requireRole(VendorDashboard, ["vendor"]) },
      { path: "profile", Component: requireRole(VendorProfile, ["vendor"]) },
      { path: "services", Component: requireRole(VendorServices, ["vendor"]) },
      { path: "packages", Component: requireRole(VendorPackages, ["vendor"]) },
      { path: "portfolio", Component: requireRole(VendorPortfolio, ["vendor"]) },
      { path: "availability", Component: requireRole(VendorAvailability, ["vendor"]) },
      { path: "quotation-requests", Component: requireRole(VendorQuotationRequests, ["vendor"]) },
      { path: "quotations", Component: requireRole(VendorQuotations, ["vendor"]) },
      { path: "bookings", Component: requireRole(VendorBookings, ["vendor"]) },
      { path: "payments", Component: requireRole(VendorPayments, ["vendor"]) },
      { path: "reviews", Component: requireRole(VendorReviews, ["vendor"]) },
      { path: "analytics", Component: requireRole(VendorAnalytics, ["vendor"]) },
      { path: "settings", Component: requireRole(VendorSettings, ["vendor"]) },
    ],
  },
  {
    path: "/admin",
    Component: requireRole(AdminLayout, ["admin"]),
    children: [
      { index: true, Component: requireRole(AdminDashboard, ["admin"]) },
      { path: "dashboard", Component: requireRole(AdminDashboard, ["admin"]) },
      { path: "users", Component: requireRole(AdminUsers, ["admin"]) },
      { path: "families", Component: requireRole(AdminFamilies, ["admin"]) },
      { path: "vendors", Component: requireRole(AdminVendors, ["admin"]) },
      { path: "vendor-verification", Component: requireRole(AdminVendorVerification, ["admin"]) },
      { path: "categories", Component: requireRole(AdminCategories, ["admin"]) },
      { path: "venues", Component: requireRole(AdminVenues, ["admin"]) },
      { path: "templates", Component: requireRole(AdminTemplates, ["admin"]) },
      { path: "bookings", Component: requireRole(AdminBookings, ["admin"]) },
      { path: "payments", Component: requireRole(AdminPayments, ["admin"]) },
      { path: "commissions", Component: requireRole(AdminCommissions, ["admin"]) },
      { path: "reviews", Component: requireRole(AdminReviews, ["admin"]) },
      { path: "reports", Component: requireRole(AdminReports, ["admin"]) },
      { path: "audit-logs", Component: requireRole(AdminAuditLogs, ["admin"]) },
      { path: "settings", Component: requireRole(AdminSettings, ["admin"]) },
    ],
  },
  {
    path: "/invite/:token",
    Component: GuestLayout,
    children: [
      { index: true, Component: GuestInvitationView },
      { path: "rsvp", Component: GuestRSVPForm },
      { path: "confirmation", Component: GuestRSVPConfirmation },
    ],
  },
  { path: "*", Component: Home },
]);

