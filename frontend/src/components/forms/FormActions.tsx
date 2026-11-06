import type { ReactNode } from 'react';

export function FormActions({ children, align = 'end' }: { children: ReactNode; align?: 'start' | 'end' | 'between' }) {
  return <div className={`form-actions form-actions--${align}`}>{children}</div>;
}
