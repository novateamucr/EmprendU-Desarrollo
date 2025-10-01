import { useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageConfirmModal } from './ImageConfirmModal';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageData: string) => void;
  className?: string;
  onImageConfirm?: (imageData: string) => void;
  placeholderInitial?: string; // Optional initial to show when no image
}

export function ImageUpload({ currentImage, onImageChange, className = '', placeholderInitial }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading, error, clearError } = useImageUpload();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<string>('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await uploadImage(file);
    if (result) {
      setPendingImage(result.base64);
      setShowConfirmModal(true);
      clearError();
    }
  };

  const handleConfirmImage = () => {
    onImageChange(pendingImage);
    setShowConfirmModal(false);
    setPendingImage('');
  };

  const handleCancelImage = () => {
    setShowConfirmModal(false);
    setPendingImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative group">
        {currentImage ? (
          <img
            src={currentImage}
            alt="Avatar"
            className="w-40 h-40 rounded-full border-4 border-white shadow-soft object-cover"
          />
        ) : (
          <div className="w-40 h-40 rounded-full border-4 border-white shadow-soft bg-brand/20 flex items-center justify-center">
            <span className="text-brandDark text-5xl font-semibold select-none">
              {(placeholderInitial || 'U').trim().charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Upload hint overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-all duration-200">
          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center px-4">
            Haz clic en la cámara para cambiar tu foto
          </span>
        </div>
        
        {/* Upload button */}
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="absolute bottom-2 right-2 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
          aria-label="Cambiar foto de perfil"
        >
          {uploading ? (
            <Upload className="w-6 h-6 animate-pulse" />
          ) : (
            <Camera className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Confirmation Modal */}
      <ImageConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCancelImage}
        onConfirm={handleConfirmImage}
        previewImage={pendingImage}
      />
    </div>
  );
}
