import { useState } from 'react';

export interface ImageUploadResult {
  file: File;
  preview: string;
  base64: string;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<ImageUploadResult | null> => {
    setUploading(true);
    setError(null);

    try {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede ser mayor a 5MB');
      }

      // Crear preview URL
      const preview = URL.createObjectURL(file);

      // Convertir a base64 para almacenamiento
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return {
        file,
        preview,
        base64
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar la imagen';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    uploadImage,
    uploading,
    error,
    clearError
  };
}
