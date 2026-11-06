import { Route, Routes } from 'react-router-dom';
import { CatalogWorkspacePage } from '../pages/catalog/CatalogPages';
import { GuestInvitationPage } from '../pages/workspace/WorkspacePages';
import { GuestLayout } from '../layouts/GuestLayout/GuestLayout';
export function GuestRoutes() {
  return <Routes><Route element={<GuestLayout />}><Route path="/invite/:token" element={<GuestInvitationPage />} /><Route path="/rsvp-confirmation" element={<CatalogWorkspacePage />} /></Route></Routes>;
}
