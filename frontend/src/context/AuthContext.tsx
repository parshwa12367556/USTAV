import axios from 'axios';
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authApi } from '../features/auth/api/authApi';
import { tokenStorage } from '../services/storage/tokenStorage';
import type { AuthSession, AuthUser, AuthWorkspace, AuthBusiness, AuthMembership } from '../types/auth.types';
import { queryClient } from '../app/queryClient';

type AuthContextValue = {
  user: AuthUser | null;
  activeRole: string | null;
  activeWorkspace: AuthWorkspace | null;
  activeBusiness: AuthBusiness | null;
  permissions: string[];
  membershipId: string | null;
  memberships: AuthMembership[];
  accountStatus: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: AuthSession) => void;
  updateProfile: (input: Partial<Pick<AuthUser, 'name' | 'phone'>>) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function clearPrivateBrowserData() {
  try {
    const privateKeys = ['utsav-events', 'utsav-planning-tasks'];
    for (const key of Object.keys(window.localStorage)) {
      if (privateKeys.includes(key) || key.startsWith('utsav-catalog:')) {
        window.localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Unable to clear saved private browser data.', error);
  }

  try {
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith('utsav')) window.sessionStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Unable to clear private session storage.', error);
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<AuthWorkspace | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<AuthBusiness | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<AuthMembership[]>([]);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(tokenStorage.get()));

  const clearSessionState = useCallback(() => {
    queryClient.clear();
    try {
      tokenStorage.clear();
    } catch (error) {
      console.error('Unable to clear stored authentication tokens.', error);
    }
    clearPrivateBrowserData();
    setUser(null);
    setActiveRole(null);
    setActiveWorkspace(null);
    setActiveBusiness(null);
    setPermissions([]);
    setMembershipId(null);
    setMemberships([]);
    setAccountStatus(null);
  }, []);

  const signOut = useCallback(async () => {
    let logoutError: unknown;
    try {
      if (tokenStorage.get()) await authApi.logout(tokenStorage.getRefresh());
    } catch (error) {
      logoutError = error;
    } finally {
      clearSessionState();
    }
    if (logoutError) throw logoutError;
  }, [clearSessionState]);

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
        setMemberships(profile.memberships ?? []);
        setAccountStatus(profile.accountStatus ?? null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          clearSessionState();
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
  }, [clearSessionState]);

  useEffect(() => {
    const handleExpiredSession = () => clearSessionState();
    window.addEventListener('utsav:session-expired', handleExpiredSession);
    return () => window.removeEventListener('utsav:session-expired', handleExpiredSession);
  }, [clearSessionState]);

  const setSession = useCallback((session: AuthSession) => {
    tokenStorage.set(session.accessToken, session.refreshToken);
    setUser(session.user);
    setActiveRole(session.activeRole ?? session.user.role ?? null);
    setActiveWorkspace(session.activeWorkspace ?? null);
    setActiveBusiness(session.activeBusiness ?? null);
    setPermissions(session.permissions ?? []);
    setMembershipId(session.membershipId ?? null);
    setMemberships(session.memberships ?? []);
    setAccountStatus(session.accountStatus ?? null);
  }, []);

  const updateProfile = useCallback(async (input: Partial<Pick<AuthUser, 'name' | 'phone'>>) => {
    const profile = await authApi.updateProfile(input);
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo(
    () => ({
      user,
      activeRole,
      activeWorkspace,
      activeBusiness,
      permissions,
      membershipId,
      memberships,
      accountStatus,
      isAuthenticated: Boolean(user),
      isLoading,
      setSession,
      updateProfile,
      signOut,
    }),
    [user, activeRole, activeWorkspace, activeBusiness, permissions, membershipId, memberships, accountStatus, isLoading, setSession, updateProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
