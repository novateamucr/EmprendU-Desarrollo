import { useState } from "react";
import Footer from "../components/footer/Footer";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Enviando...");

    try {
      const res = await fetch("https://emprendu-desarrollo-production.up.railway.app/api/ContactUs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (!res.ok) throw new Error("Error al enviar el correo");

      const data = await res.json();
      setStatus(data.message);
      setFormData({ email: "", subject: "", message: "" });
      setTimeout(() => setStatus(""), 4000);
    } catch (err) {
      console.error(err);
      setStatus("Error al enviar el mensaje");
      setTimeout(() => setStatus(""), 4000);
    }
  };

  return (
    <div className="flex flex-col h-[100vh]">
      <main className="flex-1 flex items-center justify-center px-10 md:p-12 mt-10 md:mt-4 lg:px-28 lg:pt-20">
        <div className="w-full mx-auto flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16 items-center">
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <h3 className="text-sm md:text-xl font-bold text-brand dark:text-brandDark leading-tight">CONTACTO</h3>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight dark:text-white">Contáctanos</h1>
            <p className="text-sm md:text-lg mt-4 dark:text-secondaryDark">Por medio de este formulario puedes ponerte en contacto con nosotros para realizar consultas, comentarios o sugerencias.</p>
            <p className="text-sm md:text-lg mt-4 dark:text-secondaryDark">Nuestro equipo revisará tu mensaje y te brindará una respuesta en el menor tiempo posible.</p>
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
              <div className="flex flex-col">
                <input
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="border p-4 rounded-xl shadow-soft text-xs sm:text-sm md:text-base mb-1 dark:bg-cardDark dark:text-white dark:border-cardDark"
                />
                <p className="text-xs sm:text-sm md:text-sm text-gray-500 mt-0 pl-2 pb-2 dark:text-secondaryDark">Correo al que deseas ser contactado</p>
              </div>
              <input
                type="text"
                name="subject"
                placeholder="Asunto"
                value={formData.subject}
                onChange={handleChange}
                required
                className="border p-4 rounded-xl shadow-soft text-xs sm:text-sm md:text-base dark:bg-cardDark dark:text-white dark:border-cardDark"
              />
              <textarea
                name="message"
                placeholder="Mensaje"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
                className="border p-4 rounded-xl shadow-soft resize-none text-xs sm:text-sm md:text-base dark:bg-cardDark dark:text-white dark:border-cardDark"
              ></textarea>
              <button
                type="submit"
                className="bg-brand dark:bg-brandDark text-white p-2 rounded-full hover:bg-brandDark dark:hover:bg-brand transition"
              >
                Enviar
              </button>
              <div className="h-6 flex items-center justify-center mt-2">
                {status && <p className="text-sm text-center text-gray-700">{status}</p>}
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}