import { Route, Routes } from 'react-router-dom';
import { VendorDashboardPage } from '../pages/workspace/WorkspacePages';
import { CatalogWorkspacePage } from '../pages/catalog/CatalogPages';
import { VendorLayout } from '../layouts/VendorLayout/VendorLayout';
export function VendorRoutes() {
  return <Routes><Route element={<VendorLayout />}>
    <Route index element={<VendorDashboardPage />} /><Route path="*" element={<CatalogWorkspacePage />} />
  </Route></Routes>;
}
