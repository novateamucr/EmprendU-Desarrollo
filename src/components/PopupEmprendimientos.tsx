import { PopupHeader } from './ui/PopupHeader';
import { Entrepreneurship } from '../services/entrepreneurshipService';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface PopupEmprendimientosProps {
  onClose: () => void;
  onSiguiente: () => void;
  entrepreneurships?: Entrepreneurship[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  userEntrepreneurshipsCount?: number;
  loading?: boolean;
}

// Popup para seleccionar un emprendimiento del usuario:
// - Lista los emprendimientos disponibles y permite elegir uno.
// - Mantiene selección local y propaga cambios vía onSelect.
// - Botones de Cancelar y Siguiente (valida selección antes de continuar).
export function PopupEmprendimientos({ onClose, onSiguiente, entrepreneurships = [], selectedId = null, onSelect, loading = false, userEntrepreneurshipsCount = 0 }: PopupEmprendimientosProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(selectedId ?? null);

  useEffect(() => {
    setLocalSelected(selectedId ?? null);
  }, [selectedId]);

  const handleChoose = (id: number) => {
    setLocalSelected(id);
    if (onSelect) onSelect(id);
  };

  

  const hasUserEntrepreneurships = (userEntrepreneurshipsCount ?? 0) > 0;
  const isAllRegistered = !loading && entrepreneurships.length === 0 && hasUserEntrepreneurships;
  const isNoEmprendimientos = !loading && entrepreneurships.length === 0 && !hasUserEntrepreneurships;
  const isEmptyCombined = isAllRegistered || isNoEmprendimientos;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white p-6 md:p-8 3xl:p-10 4xl:p-12 rounded-xl max-w-md w-full shadow-lg max-h-[90vh] overflow-auto 3xl:max-w-lg 4xl:max-w-xl">
        <PopupHeader title="Selecciona tu emprendimiento" variant="help" />

        {/* Estado de carga, vacío o lista de emprendimientos */}
        <div className="space-y-4">
          {loading && (
            <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-500">Cargando emprendimientos...</p>
          )}

          {isAllRegistered && (
            <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-500">Ya registraste todos tus emprendimientos en esta feria.</p>
          )}

          {isNoEmprendimientos && (
            <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-500">No tienes emprendimientos registrados.</p>
          )}

          {!loading && !isAllRegistered && entrepreneurships.map((e) => (
            <div key={e.id}>
              <input
                type="radio"
                id={`emp-${e.id}`}
                name="emprendimiento"
                value={e.id}
                className="hidden peer"
                checked={localSelected === e.id}
                onChange={() => handleChoose(e.id)}
              />
              <label htmlFor={`emp-${e.id}`}
                className="flex items-center p-4 3xl:p-5 4xl:p-6 border rounded-xl cursor-pointer transition hover:shadow-md 
                peer-checked:bg-gray-100 peer-checked:border-black"
              >
                <img src={e.image_url || 'img/Frame 11.jpg'} alt={e.name || 'Emprendimiento'} className="w-12 h-12 3xl:w-14 3xl:h-14 4xl:w-16 4xl:h-16 rounded-lg object-cover mr-4" />
                <div>
                 
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base 3xl:text-lg 4xl:text-xl">{e.name}</h3>
                  
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* Botones de acción: si está vacío mostrar sólo Cancelar */}
  <div className={`flex ${isEmptyCombined ? '' : 'space-x-3'} mt-6`}> 
          <button
            className="flex-1 py-2 3xl:py-2.5 4xl:py-3 rounded-full border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition text-sm md:text-base 3xl:text-lg 4xl:text-xl"
            onClick={onClose}
          >
            Cancelar
          </button>

          {!isEmptyCombined && (
            <button
              className="flex-1 py-2 3xl:py-2.5 4xl:py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition text-sm md:text-base 3xl:text-lg 4xl:text-xl"
              onClick={() => {
                if (!localSelected) {
                  toast.error('Seleccione un emprendimiento para continuar');
                  return;
                }
                onSiguiente();
              }}
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
