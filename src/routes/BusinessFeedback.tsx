import { useState } from "react";
import Btn from '../components/ui/Btn';

export default function BusinessFeedback() {
    const [rating, setRating] = useState(0);

    return (
        <div className='flex-1 flex flex-col items-center justify-center bg-background h-screen'>
            <div className="items-center justify-center bg-white rounded-xl pb-16 w-1/2 ">
                
                {/* Encabezado */}
                <div className="bg-slate-200 w-full h-[50%] flex flex-col items-center gap-6  justify-center rounded-xl">
                    <h2 className="text-2xl font-bold text-slate-700 ">¡Califica tu experiencia!</h2>
                    <img src="" className="w-32 h-32 rounded-full bg-slate-400" alt="" />
                    <p className="text-slate-600 align-middle ">Nombre_del_producto</p>
                </div>

                <div className="flex flex-col items-center mt-4 gap-4"> 
                    <div className="flex gap-10">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                onClick={() => setRating(star)}
                                className={`cursor-pointer text-6xl ${
                                    star <= rating ? "text-yellow-400" : "text-gray-300"
                                }`}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                </div>

                {/* Comentarios */}
                <div className="flex flex-col items-center m-6 gap-6">
                    <p className="text-slate-500 self-start pl-10">Comentarios (opcional)</p>
                    <textarea
                        className="w-[90%] h-32 border border-gray-300 rounded-lg p-2 resize-none items-center text-slate-500 "
                        placeholder="Escribe tus comentarios aquí..."
                    ></textarea>
                     
                        <Btn
                          style="hover:bg-green-600  bg-black text-white font-black p-3 rounded-full w-[90%]"
                          key="restablecerPw"
                          text="Enviar enlace"
                          onClick={() => alert('Gracias por tu feedback!')}
                        />
                      
                </div>
            </div>
        </div>
    );
}
