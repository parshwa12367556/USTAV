
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("utsvav_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("utsvav_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export class ApiError extends Error {
  constructor(public message: string, public status?: number, public errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
  }
}

export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  const axiosError = error as AxiosError<{ message?: string; error?: string }>;
  if (axiosError.response?.data?.message) return axiosError.response.data.message;
  if (axiosError.response?.data?.error) return axiosError.response.data.error;
  if (axiosError.message) return axiosError.message;
  return "An unexpected error occurred";
}

