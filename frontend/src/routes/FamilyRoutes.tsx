import { Route, Routes } from 'react-router-dom';
import { BudgetPage, BookingsPage, DashboardPage, EventFunctionsPage, EventsPage, GuestGroupsPage, GuestsPage, InvitationsPage, SettingsPage, VendorsPage } from '../pages/workspace/WorkspacePages';
import { FamilyLayout } from '../layouts/FamilyLayout/FamilyLayout';
export function FamilyRoutes() {
  return <Routes><Route element={<FamilyLayout />}>
    <Route index element={<DashboardPage />} /><Route path="events" element={<EventsPage />} /><Route path="events/:eventId/functions" element={<EventFunctionsPage />} /><Route path="functions/:functionId" element={<EventFunctionsPage />} /><Route path="guest-groups" element={<GuestGroupsPage />} /><Route path="guests" element={<GuestsPage />} />
    <Route path="invitations" element={<InvitationsPage />} /><Route path="vendors" element={<VendorsPage />} /><Route path="budget" element={<BudgetPage />} />
    <Route path="bookings" element={<BookingsPage />} /><Route path="settings" element={<SettingsPage />} />
  </Route></Routes>;
}
