import { useEffect, type PropsWithChildren } from 'react';

type DrawerProps = PropsWithChildren<{ open: boolean; title: string; onClose: () => void }>;
export function Drawer({ open, title, onClose, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="drawer" aria-label={title} role="dialog" aria-modal="true">
      <header><h2>{title}</h2><button type="button" aria-label="Close" onClick={onClose}>×</button></header>{children}
    </aside>
  </div>;
}
