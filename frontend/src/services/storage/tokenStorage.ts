let accessToken: string | null = null;
let csrfToken: string | null = null;
const legacyTokenKeys = ['utsav.access-token', 'utsav.refresh-token'];

if (typeof window !== 'undefined') {
  try {
    legacyTokenKeys.forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    console.error('Unable to remove legacy browser authentication tokens.', error);
  }
}

export const tokenStorage = {
  get(): string | null {
    return accessToken;
  },
  set(token: string): void {
    accessToken = token;
  },
  clear(): void {
    accessToken = null;
    csrfToken = null;
    if (typeof window !== 'undefined') {
      try {
        legacyTokenKeys.forEach((key) => window.localStorage.removeItem(key));
      } catch (error) {
        console.error('Unable to remove legacy browser authentication tokens.', error);
      }
    }
  },
};

export function getCsrfToken(): string | null {
  if (csrfToken) return csrfToken;
  if (typeof document === 'undefined') return null;
  const prefix = 'utsav_csrf=';
  const cookie = document.cookie.split('; ').find((value) => value.startsWith(prefix));
  csrfToken = cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
  return csrfToken;
}

export function setCsrfToken(token: string): void {
  csrfToken = token;
}
