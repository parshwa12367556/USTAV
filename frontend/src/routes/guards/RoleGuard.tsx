import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import type { UserRole } from '../../types/user.types';
import { useAuth } from '../../hooks/useAuth';
export function RoleGuard({ roles, children }: PropsWithChildren<{ roles: readonly UserRole[] }>) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || (!roles.includes(user.role) && user.role !== 'admin')) return <Navigate to="/not-found" replace />;
  return children;
}
