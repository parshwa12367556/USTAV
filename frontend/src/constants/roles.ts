import type { UserRole } from '../types/user.types';

export const userRoles: readonly UserRole[] = ['family', 'vendor', 'admin', 'guest'];

export const roleLabels: Record<UserRole, string> = {
  family: 'Family',
  vendor: 'Vendor',
  admin: 'Administrator',
  guest: 'Guest',
};
