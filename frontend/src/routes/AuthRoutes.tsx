import { Route, Routes } from 'react-router-dom';
import { CatalogWorkspacePage } from '../pages/catalog/CatalogPages';
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout';
export function AuthRoutes() {
  return <Routes>
    <Route path="/login" element={<AuthLayout title="Welcome back"><CatalogWorkspacePage /></AuthLayout>} />
    <Route path="/register" element={<AuthLayout title="Create your account"><CatalogWorkspacePage /></AuthLayout>} />
    <Route path="/verify-otp" element={<AuthLayout title="Verify your phone"><CatalogWorkspacePage /></AuthLayout>} />
  </Routes>;
}
