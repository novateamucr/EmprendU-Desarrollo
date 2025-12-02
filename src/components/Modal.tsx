import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { PopupHeader, type PopupVariant } from './ui/PopupHeader';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  variant?: PopupVariant; // info | confirm | danger | success | warning | error | help
  children: ReactNode;
  dialogClassName?: string;
}

export function Modal({ isOpen, onClose, title, subtitle, variant = 'info', children, dialogClassName }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white dark:bg-backgroundDark rounded-card shadow-soft max-w-md w-full max-h-[90vh] overflow-y-auto cartegory-scroll ${dialogClassName ?? ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <PopupHeader title={title} subtitle={subtitle} variant={variant} />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full transition-colors hover:bg-brand/10 focus:outline-none focus:ring-2 focus:ring-brand dark:focus:ring-brandDark focus:ring-offset-2"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5 text-secondary hover:text-brand dark:hover:text-brandDark" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
