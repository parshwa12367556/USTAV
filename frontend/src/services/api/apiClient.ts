import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { env } from '../../config/env';
import { getCsrfToken, setCsrfToken, tokenStorage } from '../storage/tokenStorage';

type RefreshResponse = { accessToken: string; csrfToken?: string };
type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
let csrfRequest: Promise<string> | null = null;

async function ensureCsrfToken(): Promise<string> {
  const cached = getCsrfToken();
  if (cached) return cached;
  csrfRequest ??= axios
    .get<{ csrfToken: string }>(`${env.apiBaseUrl}/auth/csrf`, {
      timeout: 20_000,
      withCredentials: true,
    })
    .then(({ data }) => {
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    })
    .finally(() => {
      csrfRequest = null;
    });
  return csrfRequest;
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 20_000,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (['post', 'put', 'patch', 'delete'].includes((config.method ?? '').toLowerCase())) {
    config.headers['X-CSRF-Token'] = await ensureCsrfToken();
  }
  return config;
});

let refreshRequest: Promise<RefreshResponse> | null = null;

apiClient.interceptors.response.use(
  (response) => {
    const csrfToken = response.data?.csrfToken;
    if (typeof csrfToken === 'string') setCsrfToken(csrfToken);
    return response;
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const request = error.config as RetriableRequest;
    const requestUrl = request.url ?? '';
    if (
      request._retry ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/2fa/')
    ) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      const csrfToken = await ensureCsrfToken();
      refreshRequest ??= axios
        .post<RefreshResponse>(
          `${env.apiBaseUrl}/auth/refresh`,
          {},
          {
            headers: { 'X-CSRF-Token': csrfToken },
            timeout: 20_000,
            withCredentials: true,
          },
        )
        .then(({ data }) => data)
        .finally(() => {
          refreshRequest = null;
        });
      const session = await refreshRequest;
      if (session.csrfToken) setCsrfToken(session.csrfToken);
      tokenStorage.set(session.accessToken);
      request.headers.Authorization = `Bearer ${session.accessToken}`;
      return await apiClient(request);
    } catch (refreshError) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('utsav:session-expired'));
      return Promise.reject(refreshError);
    }
  },
);
