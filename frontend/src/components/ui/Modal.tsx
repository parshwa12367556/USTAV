import { useEffect, type PropsWithChildren, type ReactNode } from 'react';

type ModalProps = PropsWithChildren<{ open: boolean; title: string; onClose: () => void; footer?: ReactNode }>;
export function Modal({ open, title, onClose, footer, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header><h2 id="modal-title">{title}</h2><button type="button" aria-label="Close" onClick={onClose}>×</button></header>
      <div className="modal-content">{children}</div>{footer && <footer>{footer}</footer>}
    </section>
  </div>;
}
