import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';

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

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="page-loading" role="status">Loading your workspace…</div>}>
      <Routes>
        <Route path="/invite/:token" element={<GuestInvitationPage />} />
        <Route path="/rsvp-confirmation" element={<CatalogWorkspacePage />} />
        <Route path="/not-found" element={<CatalogWorkspacePage />} />
        <Route path="/home" element={<PublicPageRoute />} />
        <Route path="/about" element={<PublicPageRoute />} />
        <Route path="/services" element={<PublicPageRoute />} />
        <Route path="/how-it-works" element={<PublicPageRoute />} />
        <Route path="/contact" element={<PublicPageRoute />} />
        <Route path="/explore/venues" element={<PublicPageRoute />} />
        <Route path="/explore/invitations" element={<PublicPageRoute />} />
        <Route path="/login" element={<PublicPageRoute />} />
        <Route path="/register" element={<PublicPageRoute />} />
        <Route path="/verify-otp" element={<PublicPageRoute />} />
        <Route path="/forgot-password" element={<PublicPageRoute />} />
        <Route path="/reset-password" element={<PublicPageRoute />} />
        <Route path="/onboarding" element={<PublicPageRoute />} />
        <Route element={<WorkspaceLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:eventId/functions" element={<EventFunctionsPage />} />
          <Route path="guests" element={<GuestsPage />} />
          <Route path="invitations" element={<InvitationsPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="venues" element={<VendorsPage category="venues" />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/categories" element={<AdminPlatformPage />} />
          <Route path="admin/commissions" element={<AdminPlatformPage />} />
          <Route path="admin/reports" element={<AdminPlatformPage />} />
          <Route path="admin/:section" element={<CatalogWorkspacePage />} />
          <Route path="vendor" element={<VendorDashboardPage />} />
          <Route path="vendor/staff" element={<VendorStaffPage />} />
          <Route path="vendor/profile" element={<VendorManagementPage />} />
          <Route path="vendor/services" element={<VendorManagementPage />} />
          <Route path="vendor/packages" element={<VendorManagementPage />} />
          <Route path="vendor/portfolio" element={<VendorManagementPage />} />
          <Route path="vendor/availability" element={<VendorManagementPage />} />
          <Route path="vendor/:section" element={<CatalogWorkspacePage />} />
          <Route path="events/create" element={<CatalogWorkspacePage />} />
          <Route path="events/:eventId" element={<CatalogWorkspacePage />} />
          <Route path="functions/:functionId" element={<EventFunctionsPage />} />
          <Route path="guest-groups" element={<GuestGroupsPage />} />
          <Route path="invitation-editor" element={<CatalogWorkspacePage />} />
          <Route path="rsvp" element={<CatalogWorkspacePage />} />
          <Route path="catering" element={<CatalogWorkspacePage />} />
          <Route path="decoration" element={<CatalogWorkspacePage />} />
          <Route path="event-management" element={<CatalogWorkspacePage />} />
          <Route path="other-services" element={<CatalogWorkspacePage />} />
          <Route path="quotations" element={<CatalogWorkspacePage />} />
          <Route path="quotations/:quoteId" element={<CatalogWorkspacePage />} />
          <Route path="payments" element={<CatalogWorkspacePage />} />
          <Route path="payments/:paymentId" element={<CatalogWorkspacePage />} />
          <Route path="bookings/:bookingId" element={<CatalogWorkspacePage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="notifications" element={<CatalogWorkspacePage />} />
          <Route path="family-settings" element={<CatalogWorkspacePage />} />
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
