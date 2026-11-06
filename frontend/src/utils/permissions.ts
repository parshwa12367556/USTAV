import type { UserRole } from '../types/user.types';

export function hasRole(actualRole: UserRole | undefined, allowedRoles: readonly UserRole[]): boolean {
  return actualRole !== undefined && allowedRoles.includes(actualRole);
}

export function canAccess(actualRole: UserRole | undefined, requiredRole: UserRole): boolean {
  return actualRole === requiredRole || actualRole === 'admin';
}
