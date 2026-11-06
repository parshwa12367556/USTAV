import type { PropsWithChildren } from 'react';

export function FormSection({ title, description, children }: PropsWithChildren<{ title: string; description?: string }>) {
  return <fieldset className="form-section"><legend>{title}</legend>{description && <p>{description}</p>}{children}</fieldset>;
}
