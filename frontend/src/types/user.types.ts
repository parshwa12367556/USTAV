export type UserRole = 'family' | 'vendor' | 'planner' | 'admin' | 'guest';
export type AccountStatus = 'active' | 'pending' | 'suspended';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl?: string;
};
