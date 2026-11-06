import { Route, Routes } from 'react-router-dom';
import { AdminPage } from '../pages/workspace/WorkspacePages';
import { CatalogWorkspacePage } from '../pages/catalog/CatalogPages';
import { AdminLayout } from '../layouts/AdminLayout/AdminLayout';
export function AdminRoutes() {
  return <Routes><Route element={<AdminLayout />}>
    <Route index element={<AdminPage />} />
    <Route path="*" element={<CatalogWorkspacePage />} />
  </Route></Routes>;
}
