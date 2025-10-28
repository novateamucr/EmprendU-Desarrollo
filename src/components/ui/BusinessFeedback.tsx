import { useState } from "react";
import Btn from "../ui/Btn";

interface BusinessFeedbackProps {
  show: boolean;
  title: string;
  entrepreneurshipName: string;
  imageUrl: string;
  onSubmit: (rating: number, comments: string) => void;
  onCancel: () => void;
}

export default function BusinessFeedback({
  show,
  title,
  entrepreneurshipName,
  imageUrl,
  onSubmit,
  onCancel,
}: BusinessFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!show) return null;

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onSubmit(rating, comments);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-500 p-4">
      {/*contenedor blanco principal */}
      <div className={`bg-white rounded-xl w-full md:w-1/3 relative overflow-y-auto transition-all duration-500 category-scroll
          ${submitted ? "pb-6 h-[80vh]" : "pb-8 max-h-[80vh]"}`}>

        {/* Parte gris*/}
        <div className={`bg-radial from-blue-400 from-40% to-white w-full flex flex-col items-center justify-center gap-2 rounded-t-xl pt-3
            transition-all duration-500 ${submitted ? "h-[80%]" : "h-[50%]"}`}>
          
          {!submitted && (
            <h2 className="text-lg font-bold text-slate-700 text-center mt-2">{title}</h2>
          )}
          {!submitted && (
            <p className="text-slate-600 text-center">{entrepreneurshipName}</p>
          )}
          <img
            src={imageUrl}
            className={`rounded-full border-2 border-slate-300 transition-all duration-500
              ${submitted ? "w-60 h-60" : "w-40 h-40"} hover:scale-105 hover:-translate-y-2`}
          />

          {!submitted ? (
            <p className="text-slate-600 text-center"></p>
          ) : (
            // Mensajes dentro de la parte gris
            <div className="flex flex-col items-center gap-2 text-center mt-4">
              <p className="text-lg font-bold text-slate-700">¡Gracias por calificarnos!</p>
              <p className="text-sm text-gray-500">Reseña enviada exitosamente</p>
            </div>
          )}
        </div>

        {!submitted ? (
          <div className="flex flex-col items-center gap-3">
            {/* Estrellas */}
            <div className="flex flex-wrap justify-center gap-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  className={`cursor-pointer text-5xl transition-transform duration-300 ${
                    star <= rating
                      ? "text-yellow-400"
                      : "text-gray-300 hover:scale-125 hover:-translate-y-1 active:scale-90"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Comentarios */}
            <p className="text-slate-500 self-start pl-10 text-sm mt-2">Comentarios (opcional)</p>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-[90%] h-24 border border-gray-300 rounded-lg p-2 resize-none text-slate-500 text-sm"
              placeholder="Escribe tus comentarios aquí..."
            />

            {/* btn enviar*/}
            <Btn
              style="hover:bg-green-600 bg-black text-white font-black p-2 text-sm rounded-full w-[90%]"
              key="enviarFeedback"
              text="Enviar"
              onClick={handleSubmit}
            />

            {/* Link Cancelar */}
            <button
              className="text-gray-400 text-xs mt-1 hover:text-gray-500 hover:underline"
              onClick={onCancel}
            >
              Calificar luego
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              className="text-gray-400 text-xs hover:text-gray-500 hover:underline"
              onClick={onCancel}
            >
              Continuar explorando productos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
