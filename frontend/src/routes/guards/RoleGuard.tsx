import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
export function RoleGuard({ roles, children }: PropsWithChildren<{ roles: readonly string[] }>) {
  const { user, activeRole, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = activeRole ?? user?.role;
  const matchesFamily = roles.includes('family') && ['family', 'family_owner', 'family_member', 'wedding_planner'].includes(role ?? '');
  const matchesVendor = roles.includes('vendor') && ['vendor', 'vendor_owner', 'vendor_staff'].includes(role ?? '');
  const matchesVendorOwner = roles.includes('vendor_owner') && (role === 'vendor_owner' || (role === 'vendor' && user?.role === 'vendor'));
  const matchesAdmin = roles.includes('admin') && ['admin', 'super_admin'].includes(role ?? '');
  const directMatch = roles.some((allowed) => allowed === role);
  if (!user || (!directMatch && !matchesFamily && !matchesVendor && !matchesVendorOwner && !matchesAdmin)) return <Navigate to="/not-found" replace />;
  return children;
}
