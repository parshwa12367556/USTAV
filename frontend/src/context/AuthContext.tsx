import { createContext, useCallback, useMemo, useState, type PropsWithChildren } from 'react';
import type { AuthSession, AuthUser } from '../types/auth.types';
import { tokenStorage } from '../services/storage/tokenStorage';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const setSession = useCallback((session: AuthSession) => {
    tokenStorage.set(session.accessToken);
    setUser(session.user);
  }, []);
  const signOut = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);
  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), setSession, signOut }), [user, setSession, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
