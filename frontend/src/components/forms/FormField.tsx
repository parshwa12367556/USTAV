import type { ReactNode } from 'react';

export function FormField({ id, label, hint, error, required, children }: { id: string; label: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return <div className="form-field">
    <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {children}
    {hint && <small id={hintId}>{hint}</small>}
    {error && <small id={errorId} className="form-error" role="alert">{error}</small>}
  </div>;
}
