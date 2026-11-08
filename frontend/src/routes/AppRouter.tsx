import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { useAuth } from '../hooks/useAuth';
import { AuthGuard } from './guards/AuthGuard';
import { PermissionGuard } from './guards/PermissionGuard';
import { RoleGuard } from './guards/RoleGuard';

const CatalogWorkspacePage = lazy(() =>
  import('../pages/catalog/CatalogPages').then((module) => ({ default: module.CatalogWorkspacePage })),
);
const AdminPlatformPage = lazy(() => import('../pages/admin/AdminPlatformPage'));
const BudgetPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.BudgetPage })));
const BookingsPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.BookingsPage })));
const DashboardPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.DashboardPage })));
const EventsPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.EventsPage })));
const EventFunctionsPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.EventFunctionsPage })));
const AdminPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.AdminPage })));
const GuestInvitationPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.GuestInvitationPage })));
const GuestsPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.GuestsPage })));
const GuestGroupsPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.GuestGroupsPage })));
const InvitationsPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.InvitationsPage })));
const MembersPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.MembersPage })));
const SettingsPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.SettingsPage })));
const VendorDashboardPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.VendorDashboardPage })));
const VendorStaffPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.VendorStaffPage })));
const VendorManagementPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.VendorManagementPage })));
const VendorsPage = lazy(() => import('../pages/workspace/WorkspacePages').then((module) => ({ default: module.VendorsPage })));
const LandingPage = lazy(() => import('../pages/public/LandingPage'));
const LegalPage = lazy(() => import('../pages/public/LegalPage'));
const MembershipPickerPage = lazy(() => import('../pages/auth/MembershipPickerPage').then((module) => ({ default: module.MembershipPickerPage })));
const AdminMfaPage = lazy(() => import('../pages/auth/AdminMfaPage').then((module) => ({ default: module.AdminMfaPage })));
const InvitationAcceptancePage = lazy(() => import('../pages/auth/InvitationAcceptancePage').then((module) => ({ default: module.InvitationAcceptancePage })));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="page-loading" role="status">Loading your workspace…</div>}>
      <Routes>
        <Route path="/" element={<HomePageRoute />} />
        <Route path="/home" element={<HomePageRoute />} />
        <Route path="/features" element={<LandingPage />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/services" element={<LandingPage />} />
        <Route path="/how-it-works" element={<LandingPage />} />
        <Route path="/contact" element={<LandingPage />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route path="/terms" element={<LegalPage />} />
        <Route path="/invite/:token" element={<GuestInvitationPage />} />
        <Route path="/workspace/invitation" element={<InvitationAcceptancePage />} />
        <Route path="/vendor/invitation" element={<InvitationAcceptancePage />} />
        <Route path="/rsvp-confirmation" element={<CatalogWorkspacePage />} />
        <Route path="/not-found" element={<CatalogWorkspacePage />} />
        <Route path="/explore/venues" element={<PublicPageRoute />} />
        <Route path="/explore/invitations" element={<PublicPageRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/admin/2fa" element={<AdminMfaPage />} />
        <Route path="/register" element={<PublicPageRoute />} />
        <Route path="/verify-otp" element={<PublicPageRoute />} />
        <Route path="/forgot-password" element={<PublicPageRoute />} />
        <Route path="/reset-password" element={<PublicPageRoute />} />
        <Route path="/onboarding" element={<PublicPageRoute />} />
        <Route path="/choose-workspace" element={<AuthGuard><MembershipPickerPage /></AuthGuard>} />
        <Route element={<AuthGuard><WorkspaceLayout /></AuthGuard>}>
          <Route path="settings" element={<SettingsPage />} />
            <Route element={<RoleGuard roles={['wedding_planner']} />}>
              <Route element={<PermissionGuard permissions={['planner.view']} />}>
              <Route path="planner" element={<DashboardPage />} />
              <Route path="planner/dashboard" element={<DashboardPage />} />
              </Route>
            </Route>
            <Route element={<RoleGuard roles={['family', 'wedding_planner']} />}>
              <Route element={<PermissionGuard permissions={['event.view']} />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="family/dashboard" element={<DashboardPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/:eventId/functions" element={<EventFunctionsPage />} />
                <Route path="events/:eventId" element={<CatalogWorkspacePage />} />
                <Route path="functions/:functionId" element={<EventFunctionsPage />} />
              </Route>
              <Route element={<PermissionGuard permissions={['event.create']} />}>
                <Route path="events/create" element={<CatalogWorkspacePage />} />
              </Route>
              <Route element={<PermissionGuard permissions={['guest.view']} />}>
                <Route path="guests" element={<GuestsPage />} />
                <Route path="guest-groups" element={<GuestGroupsPage />} />
                <Route path="rsvp" element={<CatalogWorkspacePage />} />
              </Route>
              <Route element={<PermissionGuard permissions={['invitation.view']} />}>
                <Route path="invitations" element={<InvitationsPage />} />
              </Route>
              <Route element={<PermissionGuard permissions={['invitation.create']} />}>
                <Route path="invitation-editor" element={<CatalogWorkspacePage />} />
              </Route>
              <Route element={<PermissionGuard permissions={['budget.view']} />}>
                <Route path="budget" element={<BudgetPage />} />
              </Route>
              <Route element={<PermissionGuard permissions={['booking.view']} />}>
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="bookings/:bookingId" element={<CatalogWorkspacePage />} />
              </Route>
              <Route element={<PermissionGuard permissions={['quotation.view']} />}>
                <Route path="quotations" element={<CatalogWorkspacePage />} />
                <Route path="quotations/:quoteId" element={<CatalogWorkspacePage />} />
              </Route>
              <Route element={<PermissionGuard permissions={['payment.view']} />}>
                <Route path="payments" element={<CatalogWorkspacePage />} />
                <Route path="payments/:paymentId" element={<CatalogWorkspacePage />} />
              </Route>
              <Route element={<RoleGuard roles={['family_owner']} />}>
                <Route path="members" element={<MembersPage />} />
                <Route path="family-settings" element={<CatalogWorkspacePage />} />
              </Route>
              <Route element={<RoleGuard roles={['family']} />}>
                <Route path="vendors" element={<VendorsPage />} />
                <Route path="venues" element={<VendorsPage category="venues" />} />
                <Route path="catering" element={<CatalogWorkspacePage />} />
                <Route path="decoration" element={<CatalogWorkspacePage />} />
                <Route path="event-management" element={<CatalogWorkspacePage />} />
                <Route path="other-services" element={<CatalogWorkspacePage />} />
                <Route path="notifications" element={<CatalogWorkspacePage />} />
              </Route>
            </Route>
          <Route element={<RoleGuard roles={['admin']} />}>
            <Route path="admin" element={<AdminPage />} />
            <Route path="admin/dashboard" element={<AdminPage />} />
            <Route path="admin/categories" element={<AdminPlatformPage />} />
            <Route path="admin/commissions" element={<AdminPlatformPage />} />
            <Route path="admin/reports" element={<AdminPlatformPage />} />
            <Route path="admin/:section" element={<CatalogWorkspacePage />} />
          </Route>
          <Route element={<RoleGuard roles={['vendor']} />}>
            <Route path="vendor" element={<VendorDashboardPage />} />
            <Route path="vendor/dashboard" element={<VendorDashboardPage />} />
            <Route path="vendor/bookings" element={<VendorDashboardPage />} />
            <Route element={<RoleGuard roles={['vendor_owner']} />}>
              <Route path="vendor/staff" element={<VendorStaffPage />} />
              <Route path="vendor/profile" element={<VendorManagementPage />} />
              <Route path="vendor/services" element={<VendorManagementPage />} />
              <Route path="vendor/packages" element={<VendorManagementPage />} />
              <Route path="vendor/portfolio" element={<VendorManagementPage />} />
              <Route path="vendor/availability" element={<VendorManagementPage />} />
              <Route path="vendor/:section" element={<CatalogWorkspacePage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function PublicPageRoute() {
  return <CatalogWorkspacePage />;
}

function HomePageRoute() {
  const { isAuthenticated, isLoading, activeRole } = useAuth();
  if (isLoading) {
    return <div className="page-loading" role="status">Checking your session…</div>;
  }
  if (isAuthenticated) {
    const destination = activeRole === 'admin' || activeRole === 'super_admin' ? '/admin/dashboard'
      : activeRole === 'vendor' || activeRole === 'vendor_owner' || activeRole === 'vendor_staff' ? '/vendor/dashboard'
        : activeRole === 'wedding_planner' ? '/planner/dashboard' : '/family/dashboard';
    return <Navigate to={destination} replace />;
  }
  return <LandingPage />;
}

function LoginRoute() {
  const { isAuthenticated, isLoading, activeRole } = useAuth();
  if (isLoading) {
    return <div className="page-loading" role="status">Checking your session…</div>;
  }
  if (!isAuthenticated) {
    return <PublicPageRoute />;
  }

  if (activeRole === 'admin' || activeRole === 'super_admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (activeRole === 'vendor' || activeRole === 'vendor_owner' || activeRole === 'vendor_staff') {
    return <Navigate to="/vendor/dashboard" replace />;
  }
  return <Navigate to={activeRole === 'wedding_planner' ? '/planner/dashboard' : '/family/dashboard'} replace />;
}
