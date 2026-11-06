const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const env = {
  apiBaseUrl: configuredApiUrl || 'http://localhost:5000/api/v1',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;
