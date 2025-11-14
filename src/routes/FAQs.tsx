import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import Footer from "../components/footer/Footer";

export default function FAQ() {
  const VISIBLE_CARDS = 3;

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const faqs = [
    {
      question: "¿Puedo comprar desde la aplicación web?",
      answer:
        "Desde la plataforma de EmpowerUp puedes realizar pedidos a los emprendimientos, ponerte en contacto con ellos, y más.",
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
      question: "¿Tiene algún costo usar EmpowerUp?",
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
    {
      question: "¿Puedo actualizar la información de mi emprendimiento?",
      answer:
        "Sí, puedes actualizar la información de tu emprendimiento en cualquier momento desde el dashboard de emprendedores.",
    }
  ];

  const totalPages = Math.ceil(faqs.length / VISIBLE_CARDS);
  const displayedFaqs = faqs.slice(
    (currentPage - 1) * VISIBLE_CARDS,
    currentPage * VISIBLE_CARDS
  );

  const handlePageChange = (page: number) => {
    setOpenIndex(null);
    setCurrentPage(page);
  };

  const toggleFAQ = (realIndex: number) => {
    setOpenIndex(openIndex === realIndex ? null : realIndex);
  };

  const FAQS_CONTAINER_HEIGHT = 425;

  return (
    <div className="flex flex-col h-[96vh]">
      <main className="flex-1">
        <div className="flex items-center justify-center md:mt-10 mt-0 h-full">
          <div className="w-full mx-auto flex flex-col md:flex-row gap-8 md:gap-24 lg:gap-40 items-center px-2 sm:px-8 md:px-20 ">
            {/* TITULOS */}
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
            {/* BLOQUE DE PREGUNTAS */}
            <div className="flex-1 p-4 md:p-8 flex flex-col items-stretch">
              <div
                className="p-6 space-y-4 relative"
                style={{
                  minHeight: FAQS_CONTAINER_HEIGHT,
                  maxHeight: FAQS_CONTAINER_HEIGHT,
                  overflow: "hidden",
                }}
              >
                {displayedFaqs.map((faq, idx) => {
                  const realIndex = (currentPage - 1) * VISIBLE_CARDS + idx;
                  return (
                    <div
                      key={realIndex}
                      className="
                        bg-white p-7 border rounded-3xl shadow-soft
                        transition-all duration-300 ease-in-out cursor-pointer
                        hover:-translate-y-1
                        snap-start
                        flex-shrink-0
                      "
                      style={{ minHeight: 96 }}
                      onClick={() => toggleFAQ(realIndex)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-sm md:text-base">
                          {faq.question}
                        </h3>
                        <button
                          className="bg-blue-400 text-white rounded-full p-2 hover:bg-blue-500 transition ease-in-out duration-300"
                          aria-label={openIndex === realIndex ? "Cerrar" : "Abrir"}
                          type="button"
                          tabIndex={-1}
                        >
                          {openIndex === realIndex ? (
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
                          ${openIndex === realIndex ? "max-h-40 opacity-100 overflow-y-auto" : "max-h-0 opacity-0"}
                        `}
                        style={{
                          maxHeight: openIndex === realIndex ? 160 : 0,
                        }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center mt-6 gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(idx + 1)}
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold
                      ${currentPage === idx + 1 ? "bg-blue-800" : "bg-blue-400 hover:bg-blue-500"}
                      transition
                      focus:outline-none
                    `}
                    aria-label={`Página ${idx + 1}`}
                    type="button"
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
            {/* FIN BLOQUE FAQS */}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}