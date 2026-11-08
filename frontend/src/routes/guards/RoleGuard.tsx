import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
export function RoleGuard({ roles }: { roles: readonly string[] }) {
  const { activeRole, isAuthenticated } = useAuth();
  const outletContext = useOutletContext<unknown>();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = activeRole ?? '';
  const matchesFamily = roles.includes('family') && ['family', 'family_owner', 'family_member'].includes(role);
  const matchesVendor = roles.includes('vendor') && ['vendor', 'vendor_owner', 'vendor_staff'].includes(role ?? '');
  const matchesVendorOwner = roles.includes('vendor_owner') && ['vendor', 'vendor_owner'].includes(role);
  const matchesAdmin = roles.includes('admin') && ['admin', 'super_admin'].includes(role ?? '');
  const directMatch = roles.some((allowed) => allowed === role);
  if (!role || (!directMatch && !matchesFamily && !matchesVendor && !matchesVendorOwner && !matchesAdmin)) return <Navigate to="/not-found" replace />;
  return <Outlet context={outletContext} />;
}
