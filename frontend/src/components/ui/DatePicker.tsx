import type { InputHTMLAttributes } from 'react';

export function DatePicker({ className = '', ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input {...props} className={`date-picker ${className}`} type="date" />;
}
