import { useState, useCallback } from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback(({
    title,
    description,
    variant = 'default',
    duration = 5000,
  }: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Add new toast
    setToasts((currentToasts) => [
      ...currentToasts,
      { id, title, description, variant },
    ]);

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((currentToasts) =>
          currentToasts.filter((toast) => toast.id !== id)
        );
      }, duration);
    }

    // Return id for manual removal
    return id;
  }, []); // No dependencies since we only use setToasts

  const removeToast = useCallback((id: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  return { toasts, toast, removeToast };
};
