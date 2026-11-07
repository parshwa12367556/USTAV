import type { UserRole } from './user.types';

export type AuthWorkspace = {
  id: string;
  name: string;
  type: 'family' | 'vendor' | 'admin';
  membershipId?: string;
  role?: string;
  permissions?: string[];
};

export type AuthBusiness = {
  id: string;
  name: string;
  type: 'vendor';
  category?: string;
  verificationStatus?: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
  activeRole?: string;
  activeWorkspace?: AuthWorkspace | null;
  activeBusiness?: AuthBusiness | null;
  permissions?: string[];
  membershipId?: string;
  accountStatus?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
};
