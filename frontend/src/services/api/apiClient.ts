import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { env } from '../../config/env';
import { tokenStorage } from '../storage/tokenStorage';

type RefreshResponse = { accessToken: string; refreshToken: string };
type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 20_000,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshRequest: Promise<RefreshResponse> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
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
      requestUrl.includes('/auth/password-reset')
    ) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) {
      tokenStorage.clear();
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      refreshRequest ??= axios
        .post<RefreshResponse>(
          `${env.apiBaseUrl}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` }, timeout: 20_000 },
        )
        .then(({ data }) => data)
        .finally(() => {
          refreshRequest = null;
        });
      const session = await refreshRequest;
      tokenStorage.set(session.accessToken, session.refreshToken);
      request.headers.Authorization = `Bearer ${session.accessToken}`;
      return await apiClient(request);
    } catch (refreshError) {
      tokenStorage.clear();
      return Promise.reject(refreshError);
    }
  },
);
