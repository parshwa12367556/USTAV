import axios from 'axios';
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { authApi } from '../features/auth/api/authApi';
import type { AuthSession, AuthUser } from '../types/auth.types';
import { tokenStorage } from '../services/storage/tokenStorage';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  updateProfile: (input: Partial<Pick<AuthUser, 'name' | 'phone'>>) => Promise<AuthUser>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    if (!tokenStorage.get()) return;
    let active = true;
    authApi.me()
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch((error: unknown) => {
        if (active && axios.isAxiosError(error) && error.response?.status === 401) tokenStorage.clear();
      });
    return () => {
      active = false;
    };
  }, []);
  const setSession = useCallback((session: AuthSession) => {
    tokenStorage.set(session.accessToken, session.refreshToken);
    setUser(session.user);
  }, []);
  const updateProfile = useCallback(async (input: Partial<Pick<AuthUser, 'name' | 'phone'>>) => {
    const profile = await authApi.updateProfile(input);
    setUser(profile);
    return profile;
  }, []);
  const signOut = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);
  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), setSession, updateProfile, signOut }),
    [user, setSession, updateProfile, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
