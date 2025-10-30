
import { PopupHeader } from './ui/PopupHeader';
import { Fair } from '../services/fairService';
import { Entrepreneurship } from '../services/entrepreneurshipService';

interface PopupDetallesProps {
  onClose: () => void;
  fair?: Fair | null;
  entrepreneurship?: Entrepreneurship | null;
  inscription?: any | null;
}

export function PopupDetalles({ onClose, fair = null, entrepreneurship = null, inscription = null }: PopupDetallesProps) {
  return (
    
<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
  
  <div className="bg-white p-8 rounded-xl max-w-md w-full shadow-lg text-center max-h-[90vh] overflow-auto">

    <PopupHeader title="Detalles de la Feria" subtitle="Revisa toda la información del evento" variant="info" />

    

        <div className="rounded-xl p-4 text-left space-y-4 border border-gray-100">

          <div className="pb-4">
            <h3 className="text-gray-800 font-semibold">Actividad</h3>
            <p className="text-sm text-gray-600">{fair?.title ?? inscription?.feria_title ?? 'Actividad de exposición y venta de productos'}</p>
          </div>

          <div className="flex items-center gap-3 pb-4">
            <svg className="w-5 h-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21s8-4.5 8-10a8 8 0 10-16 0c0 5.5 8 10 8 10z" />
            </svg>
            <p className="text-sm text-gray-600">{fair?.location ?? inscription?.feria_location ?? 'Parque de San Ramón'}</p>
          </div>

          <div className="pb-4">
            <h3 className="text-gray-800 font-semibold">Fecha y hora</h3>
            <p className="text-sm text-gray-600">{fair?.time ?? inscription?.feria_time ?? 'Sábado 5 de Octubre · 10:00 am - 6:00 pm'}</p>
          </div>

          <div>
            <h3 className="text-gray-800 font-semibold">Emprendimiento</h3>
            <div className="flex items-center gap-3 mt-2">
              <img src={entrepreneurship?.image_url || 'img/Frame 11.jpg'} alt="Logo emprendimiento" className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <p className="text-sm text-gray-700 font-medium">{entrepreneurship?.name ?? inscription?.emprendimiento_name ?? '—'}</p>
              </div>
            </div>
          </div>

    </div>

    
    <div className="flex justify-end mt-6">
  <button
    className="px-4 py-2 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition"
    onClick={onClose} 
  >
    Cerrar
  </button>
</div>

  </div>
</div>


  );
}
