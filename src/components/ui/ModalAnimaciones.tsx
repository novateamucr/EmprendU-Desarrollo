import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { PopupHeader, type PopupVariant } from '../ui/PopupHeader';

interface NoticeProps {
  title: string;
  description?: string;
}

interface ModalAnimacionesProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  variant?: PopupVariant; // info | confirm | danger | success | warning | error | help
  children: ReactNode;

  pointerGifSrc?: string;
  pointerGifAlt?: string;
  leftContent?: ReactNode;

  notice?: NoticeProps;

  size?: 'md' | 'lg' | 'xl';
}

export function ModalAnimaciones({
  isOpen,
  onClose,
  title,
  subtitle,
  variant = 'info',
  children,
  pointerGifSrc,
  pointerGifAlt = 'Animación de puntero',
  leftContent,
  notice,
  size = 'lg',
}: ModalAnimacionesProps) {
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

  const maxWidth =
    size === 'md' ? 'max-w-2xl' :
    size === 'xl' ? 'max-w-5xl' :
    'max-w-4xl';

  const hasLeft = Boolean(leftContent || pointerGifSrc);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-card shadow-soft w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <PopupHeader title={title} subtitle={subtitle} variant={variant} />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full transition-colors hover:bg-brand/10 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5 text-secondary hover:text-brand" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className={`grid gap-8 ${hasLeft ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Columna izquierda */}
            {hasLeft && (
              <div className="relative min-h-[220px] flex items-center justify-center">
                {leftContent ? (
                  leftContent
                ) : (
                  <img
                    src={pointerGifSrc!}
                    alt={pointerGifAlt}
                    className="w-512 h-512 select-none pointer-events-none"
                  />
                )}
              </div>
            )}

            {/* Columna derecha */}
            <div className="space-y-6 items-start">
              {notice && (
                <div className="rounded-xl bg-sky-100 text-sky-900 px-4 py-3">
                  <p className="font-semibold">{notice.title}</p>
                  {notice.description && (
                    <p className="text-sm opacity-90 mt-1">{notice.description}</p>
                  )}
                </div>
              )}
              <div>{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
