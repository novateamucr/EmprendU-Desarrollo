import { X } from 'lucide-react';
import { useEffect } from 'react';
import { ToastData } from '../../hooks/useToast';

interface ToastProps extends ToastData {
  onDismiss: (id: string) => void;
}

export function Toast({ id, title, description, variant = 'default', onDismiss }: ToastProps) {
  const variantStyles = {
    default: 'bg-white border border-gray-200',
    destructive: 'bg-red-50 border border-red-200',
    success: 'bg-green-50 border border-green-200',
  };

  const titleStyles = {
    default: 'text-gray-900',
    destructive: 'text-red-900',
    success: 'text-green-900',
  };

  const descriptionStyles = {
    default: 'text-gray-500',
    destructive: 'text-red-700',
    success: 'text-green-700',
  };

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div 
      className={`${variantStyles[variant]} rounded-lg shadow-lg p-4 max-w-sm w-full mb-2 transition-all duration-300`}
      role="alert"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${titleStyles[variant]}`}>
            {title}
          </h3>
          {description && (
            <p className={`mt-1 text-sm ${descriptionStyles[variant]}`}>
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="ml-4 text-gray-400 hover:text-gray-500"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
