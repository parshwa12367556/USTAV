const ACCESS_TOKEN_KEY = 'utsav.access-token';

export const tokenStorage = {
  get(): string | null {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  set(token: string): void {
    if (typeof window !== 'undefined') window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  clear(): void {
    if (typeof window !== 'undefined') window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};
