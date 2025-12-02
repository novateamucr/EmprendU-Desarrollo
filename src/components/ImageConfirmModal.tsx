import { Modal } from './Modal';

interface ImageConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previewImage: string;
}

export function ImageConfirmModal({ isOpen, onClose, onConfirm, previewImage }: ImageConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar cambio de foto"
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <img
            src={previewImage}
            alt="Vista previa"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
          />
        </div>
        
        <p className="text-sm text-secondary text-center dark:text-secondaryDark">
          ¿Está seguro que desea cambiar su foto de perfil por esta imagen?
        </p>
        
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors dark:border dark:border-brandDark dark:text-white dark:bg-backgroundDark dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-gray-800 transition-colors dark:bg-brandDark dark:hover:bg-brand"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  );
}
