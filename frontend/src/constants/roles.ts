import type { UserRole } from '../types/user.types';

export const userRoles: readonly UserRole[] = ['family', 'vendor', 'planner', 'admin', 'guest'];

export const roleLabels: Record<UserRole, string> = {
  family: 'Family',
  vendor: 'Vendor',
  planner: 'Wedding planner',
  admin: 'Administrator',
  guest: 'Guest',
};
