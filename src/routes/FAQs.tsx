import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import Footer from "../components/footer/Footer";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const CARD_HEIGHT = 96; 
  const CARD_GAP = 16;  
  const VISIBLE_CARDS = 4;
  const containerHeight = VISIBLE_CARDS * CARD_HEIGHT + (VISIBLE_CARDS - 1) * CARD_GAP;

  const faqs = [
    {
      question: "¿Puedo comprar desde la aplicación web?",
      answer:
        "Desde la plataforma de EmprendU puedes realizar pedidos a los emprendimientos, ponerte en contacto con ellos, y más.",
    },
    {
      question: "¿Puedo contactar a un emprendimiento?",
      answer:
        "Sí, puedes contactar directamente a los emprendimientos ya sea cuando realices un pedido o desde su perfil.",
    },
    {
      question: "¿Quién organiza las ferias nuevas?",
      answer:
        "Las ferias pueden ser organizadas por las municipalidades de las comunidades, las asociaciones de estudiantes de las universidades y otros grupos interesados en promover el emprendimiento local que se pongan en contacto con nosotros para promover sus ferias.",
    },
    {
      question: "¿Recibo notificaciones de ferias nuevas?",
      answer: "No es una funcionalidad disponible actualmente.",
    },
    {
      question: "¿Tiene algún costo usar EmprendU?",
      answer:
        "No, el registro y la exploración de emprendimientos son completamente gratuitos.",
    },
    {
      question: "¿Cómo puedo encontrar emprendimientos o productos?",
      answer:
        "Puedes usar el buscador o los filtros por categoría, ubicación o tipo de producto para descubrir nuevos emprendimientos.",
    },
    {
      question: "¿Cómo puedo registrar mi emprendimiento?",
      answer:
        "Primero regístrate como emprendedor, luego en el navegador superior, haz click en Mis emprendimientos y desde el dashboard, selecciona “Crear mi primer emprendimiento” y completa la información solicitada (nombre, descripción, categoría, imágenes, etc.).",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col h-[96vh] mt-6">
      <main className="flex-1">
        <div className="flex items-center justify-center md:mt-16 mt-0 h-full">
          <div className="w-full mx-auto flex flex-col md:flex-row gap-8 md:gap-24 lg:gap-40 items-center px-2 sm:px-8 md:px-20  pt-10 mt-4">
            <div className="flex flex-col gap-3 p-6" style={{ minWidth: 260 }}>
              <h1 className="text-5xl md:text-6xl font-bold text-blue-400 leading-tight">
                Preguntas
              </h1>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Frecuentes
              </h1>
              <p className="text-sm md:text-base mt-2">
                ¿Tienes más preguntas?{" "}
                <a href="/contactUs" className="hover:underline text-blue-400">
                  Contáctanos
                </a>
              </p>
            </div>

            <div className="flex-1 p-4 md:p-8">
              <div
                className="
              p-6
              space-y-4
              overflow-y-auto
              scroll-smooth
              snap-y snap-mandatory
              pr-2
              category-scroll
            "
                style={{
                  height: containerHeight, 
                  overscrollBehavior: "contain",
                }}
              >
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="
                  bg-white p-7 border rounded-3xl shadow-soft
                  transition-all duration-300 ease-in-out cursor-pointer
                  hover:-translate-y-1
                  snap-start
                  flex-shrink-0
                "
                    style={{ minHeight: CARD_HEIGHT }}
                    onClick={() => toggleFAQ(index)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm md:text-base">
                        {faq.question}
                      </h3>
                      <button
                        className="bg-blue-400 text-white rounded-full p-2 hover:bg-blue-500 transition ease-in-out duration-300"
                        aria-label={openIndex === index ? "Cerrar" : "Abrir"}
                      >
                        {openIndex === index ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>
                    <p
                      className={`
                    text-xs md:text-sm mt-3 text-gray-600
                    transition-all duration-300 
                    overflow-hidden
                    ${openIndex === index ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}
                  `}
                    >
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};