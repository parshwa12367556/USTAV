import type { ReactNode } from 'react';

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="empty-state" role="status"><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}
