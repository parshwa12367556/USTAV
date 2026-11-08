import type { UserRole } from './user.types';

export type AuthWorkspace = {
  id: string;
  name: string;
  type: 'family' | 'vendor' | 'planner' | 'admin';
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

export type AuthMembership = {
  id: string;
  kind: 'family' | 'vendor' | 'planner' | 'admin';
  name: string;
  role: string;
  permissions: string[];
  membershipId: string;
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
  recoveryCodes?: string[];
  user: AuthUser;
  activeRole?: string;
  activeWorkspace?: AuthWorkspace | null;
  activeBusiness?: AuthBusiness | null;
  permissions?: string[];
  membershipId?: string;
  memberships?: AuthMembership[];
  accountStatus?: string;
};

export type UserSessionInfo = {
  id: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string | null;
  lastActivityAt: string;
  expiresAt: string;
  current: boolean;
};

export type AdminMfaChallenge = {
  mfaRequired: true;
  mfaSetupRequired: boolean;
  challengeToken: string;
};

export type AuthResult = AuthSession | AdminMfaChallenge;

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  workspaceName?: string;
  businessName?: string;
  category?: string;
  city?: string;
  address?: string;
  description?: string;
  companyName?: string;
  yearsExperience?: number;
};
