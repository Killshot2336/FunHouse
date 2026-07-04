import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface GameModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function GameModal({ title, onClose, children }: GameModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="holo-card holo-card-intense p-4 max-w-sm w-full space-y-3 max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--card-bg)', color: 'var(--text-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm">{title}</h3>
          <button type="button" onClick={onClose} className="theme-btn text-xs px-2 py-1">✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
