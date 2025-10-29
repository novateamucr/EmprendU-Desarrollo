import Footer from "../components/footer/Footer";

export default function ContactUs() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex items-center justify-center p-5 md:p-12 mt-10 md:mt-4 lg:p-28" > 
        <div className="w-full mx-auto flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16 items-center">
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <h3 className="text-sm md:text-xl font-bold text-blue-400 leading-tight">CONTACTO</h3>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">Contáctanos</h1>
            <p className="text-sm md:text-lg mt-4">Por medio de este formulario puedes ponerte en contacto con nosotros para realizar consultas, comentarios o sugerencias. Las consultas enviadas serán confidenciales siempre que se mantenga un lenguaje respetuoso y adecuado.</p>
            <p className="text-sm md:text-lg mt-4">Nuestro equipo revisará tu mensaje y te brindará una respuesta en el menor tiempo posible.</p>
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            <form className="flex flex-col gap-4 w-full max-w-md">
              <input type="text" placeholder="Correo electrónico" className="border p-4 rounded-xl shadow-soft text-xs sm:text-sm md:text-base" />
              <input type="text" placeholder="Asunto" className="border p-4 rounded-xl shadow-soft text-xs sm:text-sm md:text-base"/>
              <textarea placeholder="Mensaje" rows={5} className="border p-4 rounded-xl shadow-soft resize-none text-xs sm:text-sm md:text-base"></textarea>
              <button type="submit" className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition">Enviar</button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}