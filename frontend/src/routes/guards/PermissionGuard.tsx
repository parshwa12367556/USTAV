import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function PermissionGuard({
  permissions,
}: {
  permissions: readonly string[];
}) {
  const { isAuthenticated, permissions: grantedPermissions } = useAuth();
  const outletContext = useOutletContext<unknown>();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!permissions.every((permission) => grantedPermissions.includes(permission))) {
    return <Navigate to="/not-found" replace />;
  }
  return <Outlet context={outletContext} />;
}
