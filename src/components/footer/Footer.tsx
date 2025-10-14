import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full mb-5 mt-5">
      <div className="flex justify-center items-center flex-wrap gap-2 font-normal text-gray-500 text-sm">
        <span>© 2025 EmprendU. Todos los derechos reservados.</span>
        <div className=" h-6 border-l border-gray-400 mx-2" />
        <a href="/faqs" className="hover:underline text-gray-500 text-sm">Preguntas frecuentes</a>
        <div className="h-6 border-l border-gray-400 mx-2" />
        <a href="/contactUs" className="hover:underline text-gray-500 text-sm">Contáctanos</a>
        <div className="h-6 border-l border-gray-400 mx-2" />
        <a href="/" className="hover:underline text-gray-500 text-sm">EmprendU</a>
      </div>
    </footer>
  );
};

export default Footer;