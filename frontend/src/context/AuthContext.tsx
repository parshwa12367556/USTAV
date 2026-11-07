import axios from 'axios';
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authApi } from '../features/auth/api/authApi';
import { tokenStorage } from '../services/storage/tokenStorage';
import type { AuthSession, AuthUser, AuthWorkspace, AuthBusiness } from '../types/auth.types';

type AuthContextValue = {
  user: AuthUser | null;
  activeRole: string | null;
  activeWorkspace: AuthWorkspace | null;
  activeBusiness: AuthBusiness | null;
  permissions: string[];
  membershipId: string | null;
  accountStatus: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: AuthSession) => void;
  updateProfile: (input: Partial<Pick<AuthUser, 'name' | 'phone'>>) => Promise<AuthUser>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<AuthWorkspace | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<AuthBusiness | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(tokenStorage.get()));

  useEffect(() => {
    if (!tokenStorage.get()) {
      setIsLoading(false);
      return;
    }
    let active = true;
    authApi.me()
      .then((profile) => {
        if (!active) return;
        setUser(profile.user);
        setActiveRole(profile.activeRole ?? profile.user.role ?? null);
        setActiveWorkspace(profile.activeWorkspace ?? null);
        setActiveBusiness(profile.activeBusiness ?? null);
        setPermissions(profile.permissions ?? []);
        setMembershipId(profile.membershipId ?? null);
        setAccountStatus(profile.accountStatus ?? null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          tokenStorage.clear();
        } else {
          console.error('Unable to restore the saved session.', error);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setSession = useCallback((session: AuthSession) => {
    tokenStorage.set(session.accessToken, session.refreshToken);
    setUser(session.user);
    setActiveRole(session.activeRole ?? session.user.role ?? null);
    setActiveWorkspace(session.activeWorkspace ?? null);
    setActiveBusiness(session.activeBusiness ?? null);
    setPermissions(session.permissions ?? []);
    setMembershipId(session.membershipId ?? null);
    setAccountStatus(session.accountStatus ?? null);
  }, []);

  const updateProfile = useCallback(async (input: Partial<Pick<AuthUser, 'name' | 'phone'>>) => {
    const profile = await authApi.updateProfile(input);
    setUser(profile);
    return profile;
  }, []);

  const signOut = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setActiveRole(null);
    setActiveWorkspace(null);
    setActiveBusiness(null);
    setPermissions([]);
    setMembershipId(null);
    setAccountStatus(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      activeRole,
      activeWorkspace,
      activeBusiness,
      permissions,
      membershipId,
      accountStatus,
      isAuthenticated: Boolean(user),
      isLoading,
      setSession,
      updateProfile,
      signOut,
    }),
    [user, activeRole, activeWorkspace, activeBusiness, permissions, membershipId, accountStatus, isLoading, setSession, updateProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
