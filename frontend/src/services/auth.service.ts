
import { delay } from "./mock-data";
import { mockUser } from "./mock-data";
import type { LoginCredentials, RegisterInput, AuthResponse, User } from "@/types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(700);
    if (import.meta.env.VITE_DEMO_MODE !== "false") {
      localStorage.setItem("utsvav_token", "demo_token_family_101");
      return { user: { ...mockUser, role: "family" }, tokens: { accessToken: "demo_token_family_101" } };
    }
    const res = await fetch("/api/v1/auth/login", { method: "POST", body: JSON.stringify(credentials) });
    return res.json();
  },
  async register(input: RegisterInput): Promise<AuthResponse> {
    await delay(800);
    if (import.meta.env.VITE_DEMO_MODE !== "false") {
      const user: User = { id: "usr_new", email: input.email, mobile: input.mobile, fullName: input.fullName, role: input.role, city: input.city, emailVerified: false, mobileVerified: false, createdAt: new Date().toISOString() };
      localStorage.setItem("utsvav_token", "demo_token_new");
      return { user, tokens: { accessToken: "demo_token_new" } };
    }
    const res = await fetch("/api/v1/auth/register", { method: "POST", body: JSON.stringify(input) });
    return res.json();
  },
  async forgotPassword(email: string): Promise<{ message: string }> {
    await delay(600);
    return { message: "If an account exists, an OTP has been sent to your registered mobile." };
  },
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    await delay(600);
    return { message: "Password reset successfully." };
  },
  async verifyOtp(token: string): Promise<{ message: string }> {
    await delay(600);
    return { message: "OTP verified successfully." };
  },
  logout() { localStorage.removeItem("utsvav_token"); },
  getToken(): string | null { return localStorage.getItem("utsvav_token"); },
  isAuthenticated(): boolean { return !!this.getToken(); },
};

