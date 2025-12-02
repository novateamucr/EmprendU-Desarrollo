import { useState } from 'react';
import { PopupHeader } from './ui/PopupHeader';
import { Fair } from '../services/fairService';
import { Entrepreneurship } from '../services/entrepreneurshipService';
import { inscripcionesApi } from '../services/inscripcionesService';
import { useToast } from '../hooks/useToast';

interface PopupDetallesProps {
  onClose: () => void;
  fair?: Fair | null;
  entrepreneurship?: Entrepreneurship | null;
  inscription?: any | null;
}

export function PopupDetalles({ onClose, fair = null, entrepreneurship = null, inscription = null }: PopupDetallesProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleCancelInscription = async () => {
    if (!inscription?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar la inscripción',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      await inscripcionesApi.delete(inscription.id);
      toast({
        title: 'Inscripción cancelada',
        description: 'Tu inscripción ha sido cancelada exitosamente',
        variant: 'success',
      });
      setShowConfirmDialog(false);
      onClose();
      // Reload to refresh the list
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo cancelar la inscripción',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Modal de confirmación de cancelación */}
      {showConfirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60] p-4">
          <div className="bg-white p-6 md:p-8 3xl:p-10 4xl:p-12 rounded-xl max-w-md 3xl:max-w-lg 4xl:max-w-xl w-full shadow-lg text-center dark:bg-backgroundDark dark:border dark:border-backgroundDark category-scroll">
            <PopupHeader 
              title="Cancelar inscripción" 
              subtitle="¿Estás seguro de que deseas cancelar tu inscripción a esta feria?" 
              variant="error" 
            />

            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
              <p className="text-sm md:text-base 3xl:text-lg text-gray-700 dark:text-gray-300">
                Esta acción no se puede deshacer. Se eliminará tu inscripción a <span className="font-semibold">{fair?.title ?? inscription?.feria_title}</span>.
              </p>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                className="flex-1 py-2 3xl:py-2.5 4xl:py-3 rounded-full border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition text-sm md:text-base 3xl:text-lg 4xl:text-xl dark:border-cardDark dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isDeleting}
              >
                No, mantener
              </button>
              <button
                className="flex-1 py-2 3xl:py-2.5 4xl:py-3 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition text-sm md:text-base 3xl:text-lg 4xl:text-xl disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-800"
                onClick={handleCancelInscription}
                disabled={isDeleting}
              >
                {isDeleting ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal principal de detalles */}
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-white p-8 md:p-8 3xl:p-10 4xl:p-12 rounded-xl max-w-md 3xl:max-w-lg 4xl:max-w-xl w-full shadow-lg text-center max-h-[90vh] overflow-auto dark:bg-backgroundDark dark:border dark:border-backgroundDark category-scroll">
          <PopupHeader title="Detalles de la Feria" subtitle="Revisa toda la información del evento" variant="info" />

    

        <div className="rounded-xl p-4 3xl:p-5 4xl:p-6 text-left space-y-4 border border-gray-100 dark:bg-cardDark dark:border-cardDark">

          <div className="pb-4">
            <h3 className="text-gray-800 dark:text-white font-semibold text-base md:text-lg 3xl:text-xl 4xl:text-2xl">Actividad</h3>
            <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-600 dark:text-secondaryDark">{fair?.title ?? inscription?.feria_title ?? 'Actividad de exposición y venta de productos'}</p>
          </div>

          <div className="flex items-center gap-3 pb-4">
            <svg className="w-5 h-5 3xl:w-6 3xl:h-6 4xl:w-7 4xl:h-7 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21s8-4.5 8-10a8 8 0 10-16 0c0 5.5 8 10 8 10z" />
            </svg>
            <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-600 dark:text-secondaryDark">{fair?.location ?? inscription?.feria_location ?? 'Parque de San Ramón'}</p>
          </div>

          <div className="pb-4">
            <h3 className="text-gray-800 dark:text-white font-semibold text-base md:text-lg 3xl:text-xl 4xl:text-2xl">Fecha y hora</h3>
            <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-600 dark:text-secondaryDark">{fair?.date ?? inscription?.feria_date ?? 'Sábado 5 de Octubre'}</p>
            <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-600 dark:text-secondaryDark">{fair?.time ?? inscription?.feria_time ?? '10:00 am - 6:00 pm'}</p>
          </div>

          <div>
            <h3 className="text-gray-800 dark:text-white font-semibold text-base md:text-lg 3xl:text-xl 4xl:text-2xl">Emprendimiento</h3>
            <div className="flex items-center gap-3 mt-2">
              <img src={entrepreneurship?.image_url || 'img/Frame 11.jpg'} alt="Logo emprendimiento" className="w-12 h-12 3xl:w-14 3xl:h-14 4xl:w-16 4xl:h-16 rounded-lg object-cover" />
              <div>

                <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-700 dark:text-white font-medium">{entrepreneurship?.name ?? inscription?.emprendimiento_name ?? '—'}</p>
              
              </div>
            </div>
          </div>

    </div>

    
    <div className="flex justify-between gap-3 mt-6">
  {inscription && (
    <button
      className="px-4 3xl:px-5 4xl:px-6 py-2 3xl:py-2.5 4xl:py-3 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition text-sm md:text-base 3xl:text-lg 4xl:text-xl disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-800"
      onClick={() => setShowConfirmDialog(true)}
      disabled={isDeleting}
    >
      Cancelar Inscripción
    </button>
  )}
  <button
    className="px-4 3xl:px-5 4xl:px-6 py-2 3xl:py-2.5 4xl:py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition text-sm md:text-base 3xl:text-lg 4xl:text-xl dark:bg-brandDark dark:hover:bg-brand"
    onClick={onClose} 
  >
    Cerrar
  </button>
</div>

  </div>
</div>
    </>
  );
}
