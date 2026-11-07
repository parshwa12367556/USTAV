import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
export function AuthGuard({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return <div className="page-loading" role="status">Checking your session…</div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location }} />;
}
