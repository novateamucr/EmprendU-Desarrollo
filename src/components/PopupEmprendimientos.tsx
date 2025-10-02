interface PopupEmprendimientosProps {
  onClose: () => void;
  onSiguiente: () => void;
}

export function PopupEmprendimientos({ onClose, onSiguiente }: PopupEmprendimientosProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg">
        <h2 className="text-xl font-bold mb-4">Selecciona tu emprendimiento</h2>

        <div className="space-y-4">
          <div>
            <input type="radio" id="hasu1" name="emprendimiento" value="hasu1" className="hidden peer" />
            <label htmlFor="hasu1"
              className="flex items-center p-4 border rounded-xl cursor-pointer transition hover:shadow-md 
                peer-checked:bg-gray-100 peer-checked:border-black"
            >
              <img src="img/Frame 11.jpg" alt="Logo Hasu" className="w-12 h-12 rounded-lg object-cover mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Hasu</h3>
                <p className="text-sm text-gray-500">Flores eternas y detalles</p>
              </div>
            </label>
          </div>

          <div>
            <input type="radio" id="hasu2" name="emprendimiento" value="hasu2" className="hidden peer" />
            <label htmlFor="hasu2"
              className="flex items-center p-4 border rounded-xl cursor-pointer transition hover:shadow-md 
                peer-checked:bg-gray-100 peer-checked:border-black"
            >
              <img src="img/Frame 11.jpg" alt="Logo Hasu" className="w-12 h-12 rounded-lg object-cover mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Hasu</h3>
                <p className="text-sm text-gray-500">Flores eternas y detalles</p>
              </div>
            </label>
          </div>

          <div>
            <input type="radio" id="hasu3" name="emprendimiento" value="hasu3" className="hidden peer" />
            <label htmlFor="hasu3"
              className="flex items-center p-4 border rounded-xl cursor-pointer transition hover:shadow-md 
                peer-checked:bg-gray-100 peer-checked:border-black"
            >
              <img src="img/Frame 11.jpg" alt="Logo Hasu" className="w-12 h-12 rounded-lg object-cover mr-4" />
              <div>
                <h3 className="font-semibold text-gray-900">Hasu</h3>
                <p className="text-sm text-gray-500">Flores eternas y detalles</p>
              </div>
            </label>
          </div>
        </div>

        {/* Botones estilo flex-1 como ConfirmationPopup */}
        <div className="flex space-x-3 mt-6">
          <button
            className="flex-1 py-2 rounded-full border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="flex-1 py-2 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition"
            onClick={onSiguiente}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
