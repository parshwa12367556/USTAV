import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { CatalogWorkspacePage } from '../pages/catalog/CatalogPages';
import {
  BudgetPage,
  BookingsPage,
  DashboardPage,
  EventsPage,
  AdminPage,
  GuestInvitationPage,
  GuestsPage,
  InvitationsPage,
  SettingsPage,
  VendorDashboardPage,
  VendorsPage,
} from '../pages/workspace/WorkspacePages';

export function AppRouter() {
  return (
    <BrowserRouter>
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
          <Route path="guests" element={<GuestsPage />} />
          <Route path="invitations" element={<InvitationsPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="venues" element={<VendorsPage category="venues" />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/:section" element={<CatalogWorkspacePage />} />
          <Route path="vendor" element={<VendorDashboardPage />} />
          <Route path="vendor/:section" element={<CatalogWorkspacePage />} />
          <Route path="events/create" element={<CatalogWorkspacePage />} />
          <Route path="events/:eventId" element={<CatalogWorkspacePage />} />
          <Route path="functions/:functionId" element={<CatalogWorkspacePage />} />
          <Route path="guest-groups" element={<CatalogWorkspacePage />} />
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
          <Route path="members" element={<CatalogWorkspacePage />} />
          <Route path="notifications" element={<CatalogWorkspacePage />} />
          <Route path="family-settings" element={<CatalogWorkspacePage />} />
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function PublicPageRoute() {
  return <CatalogWorkspacePage />;
}
