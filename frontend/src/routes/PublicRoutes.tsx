import { Route, Routes } from 'react-router-dom';
import { CatalogWorkspacePage } from '../pages/catalog/CatalogPages';
import { PublicLayout } from '../layouts/PublicLayout/PublicLayout';
export function PublicRoutes() {
  return <Routes><Route element={<PublicLayout />}>
    <Route path="/home" element={<CatalogWorkspacePage />} /><Route path="/about" element={<CatalogWorkspacePage />} />
    <Route path="/services" element={<CatalogWorkspacePage />} /><Route path="/contact" element={<CatalogWorkspacePage />} />
    <Route path="/explore/*" element={<CatalogWorkspacePage />} />
  </Route></Routes>;
}
