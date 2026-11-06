
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService } from "@/services/auth.service";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      setUser({ id: "usr_101", email: "rajesh.sharma@example.com", mobile: "+91 98765 43210", fullName: "Rajesh Sharma", role: "family", city: "Delhi", emailVerified: true, mobileVerified: true, createdAt: "2025-06-12T09:00:00Z" });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    setUser(res.user);
  };

  const register = async (input: any) => {
    const res = await authService.register(input);
    setUser(res.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

