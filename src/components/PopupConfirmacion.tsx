import { PopupHeader } from './ui/PopupHeader';
import { Fair } from '../services/fairService';
import { Entrepreneurship } from '../services/entrepreneurshipService';
import { toast } from 'react-toastify';

interface ConfirmationPopupProps {
  onClose: () => void;
  onConfirmar: (feriaId: number, emprendimientoId: number) => void;
  fair?: Fair | null;
  entrepreneurship?: Entrepreneurship | null;
}

export function ConfirmationPopup({ onClose, onConfirmar, fair = null, entrepreneurship = null }: ConfirmationPopupProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white p-6 md:p-8 3xl:p-10 4xl:p-12 rounded-xl max-w-md 3xl:max-w-lg 4xl:max-w-xl w-full shadow-lg text-center max-h-[90vh] overflow-auto">
        <PopupHeader title="Confirmar inscripción" subtitle="Revisa los detalles antes de continuar" variant="confirm" />

        {/* Resumen */}
        <div className="rounded-xl p-4 3xl:p-5 4xl:p-6 text-left space-y-4 border border-gray-100">
              <div className="pb-4">
                <h3 className="text-gray-800 font-semibold text-base md:text-lg 3xl:text-xl 4xl:text-2xl">Actividad</h3>
                <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-600">{fair?.title ?? 'Actividad de exposición y venta de productos'}</p>
              </div>

          <div className="flex items-center gap-3 pb-4">
            <svg className="w-5 h-5 3xl:w-6 3xl:h-6 4xl:w-7 4xl:h-7 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21s8-4.5 8-10a8 8 0 10-16 0c0 5.5 8 10 8 10z" />
            </svg>
                <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-600">{fair?.location ?? 'Parque de San Ramón'}</p>
          </div>

          <div className="pb-4">
            <h3 className="text-gray-800 font-semibold text-base md:text-lg 3xl:text-xl 4xl:text-2xl">Fecha y hora</h3>
                <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-600">{fair?.date ?? 'Sábado 5 de Octubre'}</p>
                <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-600">{fair?.time ?? '10:00 am - 6:00 pm'}</p>
          </div>

          <div>
            <h3 className="text-gray-800 font-semibold text-base md:text-lg 3xl:text-xl 4xl:text-2xl">Emprendimiento</h3>
            <div className="flex items-center gap-3 mt-2">
              <img src="img/Frame 11.jpg" alt="Logo emprendimiento" className="w-12 h-12 3xl:w-14 3xl:h-14 4xl:w-16 4xl:h-16 rounded-lg object-cover" />
              <div>
                    
                    <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-700 font-medium">{entrepreneurship?.name ?? '—'}</p>
                    
              </div>
            </div>
          </div>
        </div>

        {/* Botones estilo anterior (flex-1) */}
        <div className="flex space-x-3 mt-6">
          <button
            className="flex-1 py-2 3xl:py-2.5 4xl:py-3 rounded-full border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition text-sm md:text-base 3xl:text-lg 4xl:text-xl"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="flex-1 py-2 3xl:py-2.5 4xl:py-3 rounded-full bg-green-600 text-white font-medium hover:bg-green-700 transition text-sm md:text-base 3xl:text-lg 4xl:text-xl"
                onClick={() => {
                  if (!fair || !entrepreneurship) {
                      toast.error('Falta información para confirmar la inscripción');
                      return;
                    }
                    onConfirmar(fair.id, entrepreneurship.id);
                }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
