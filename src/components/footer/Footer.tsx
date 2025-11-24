import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full mb-5 mt-5">
      <div className="flex flex-col md:flex-row justify-center items-center flex-wrap md:gap-5 gap-2 font-normal text-gray-500 mb-5 mt-10">
        <div className="order-1 md:order-2 flex flex-row items-center gap-3 flex-wrap justify-center">
          <a href="/faqs" className="hover:underline hover:text-brand text-gray-500 text-xs md:text-sm">Preguntas frecuentes</a>
          <div className="h-6 border-l border-gray-400 mx-2 hidden md:block" />
          <a href="/contactUs" className="hover:underline hover:text-brand text-gray-500 text-xs md:text-sm">Contáctanos</a>
          <div className="h-6 border-l border-gray-400 mx-2 hidden md:block" />
          <a href="/" className="hover:underline hover:text-brand text-gray-500 text-xs md:text-sm">EmpowerUp</a>
        </div>
        <span className="order-2 md:order-1 text-center w-full md:w-auto text-xs md:text-sm mt-2 md:mt-0">
          © 2025 EmpowerUp. Todos los derechos reservados.
        </span>
      </div>
    </footer>
  );
};

export default Footer;