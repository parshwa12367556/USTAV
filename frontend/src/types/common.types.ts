export type Id = string;
export type CurrencyCode = 'INR' | 'USD';
export type LoadState = 'idle' | 'loading' | 'success' | 'error';

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};

export type SelectOption<T extends string = string> = {
  label: string;
  value: T;
  disabled?: boolean;
};

export type WithTimestamps = {
  createdAt: string;
  updatedAt: string;
};
