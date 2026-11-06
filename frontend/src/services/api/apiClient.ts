import axios from 'axios';
import { env } from '../../config/env';
import { tokenStorage } from '../storage/tokenStorage';

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
