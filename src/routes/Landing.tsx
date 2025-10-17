import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { Link } from "react-router-dom";
import { CardLanding } from "../components/CardLanding";
import { Eye, Users, TrendingUp } from "lucide-react"; // Íconos importados

import emprendu from "../assets/emprendu.svg";
import hero from "../assets/hero-blue.png";
import footerHero from "../assets/hero-w.png";
import x from "../assets/x.svg";
import insta from "../assets/instagram_icon.svg";
import youtube from "../assets/youtube_icon.svg";
import tiktok from "../assets/tiktok_icon.svg";



// Animación del menú móvil
const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const logo = (
    <Link to="/" className="flex items-center">
      <img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />
    </Link>
  );

const AnimatedNav = styled.nav``;

const AnimatedMobileMenu = styled.div`
  animation: ${slideInRight} 0.2s ease-out;
  will-change: transform, opacity;
`;

const HoverButton = styled.button`
  transition: transform 0.12s ease-out, box-shadow 0.12s ease-out;
  will-change: transform, box-shadow;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default function Landing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const items = [
    { label: "Nosotros", href: "#porque" },
    { label: "Contacto", href: "#contacto" },
    { label: "Login", Link: "/login", href: "/login" },
  ];

  // Cierra el menú con tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";
      };
    }
  }, [isMobileMenuOpen]);

  // Cierra menú si se cambia a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  return (
    <div className="bg-white text-gray-900">
      {/* Navbar arriba */}
      <AnimatedNav className="fixed top-4 left-1/2 transform -translate-x-1/2 max-w-3xl w-full px-4 z-40">
        <div className="bg-white rounded-[16px] shadow-soft border border-border px-6 py-3 h-14 flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Logo */}
            <div className="flex items-center">
                {logo}
            </div>

            {/* Navegación Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              {items.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="text-gray-700  hover:text-brandDark px-3   font-medium"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Botón menú móvil */}
            <div className="flex items-center space-x-4">
              <HoverButton
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-secondary" />
                ) : (
                  <Menu className="w-5 h-5 text-secondary" />
                )}
              </HoverButton>
            </div>
          </div>
        </div>
      </AnimatedNav>

      {/* Menú móvil */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          

          {/* Panel menú */}
          <AnimatedMobileMenu className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
                {logo}
              <HoverButton
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5 text-secondary" />
              </HoverButton>
            </div>

            {/* Opciones */}
            <div className="py-4 space-y-1">
              {items.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-6 py-3 text-gray-700 hover:bg-gray-100 font-medium"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </AnimatedMobileMenu>
        </div>
      )}

      {/* Hero */}
      <section className="max-w-7xl mx-auto md:px-12 py-28 grid md:grid-cols-2 items-center gap-12">
        <div>
          <img src={emprendu} alt="EmprendU Logo" className="w-28 mb-6" />
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-6">
            Haz que tu idea llegue más lejos. Comparte, conecta y haz crecer tu
            emprendimiento con EmprendU.
          </h1>
          <p className="text-gray-600 mb-6">
            EmprendU es una plataforma para la comunidad donde podés registrar,
            gestionar y dar visibilidad a los proyectos emprendedores.
          </p>
          <div className="flex gap-4">
            <Link to="/register">
              <button className="px-6 py-3 border bg-brand text-white rounded-full hover:bg-brandDark transition-colors">
                Registrarse gratis
              </button>
            </Link>
          </div>
        </div>

        {/* Imagen con íconos */}
        <div className="relative flex justify-center">
          <img src={hero} alt="Hero" className="w-72 md:w-90 relative z-10 animate-float" />
          <img src={hero} alt="icono" className="absolute w-16 top-0 right-20 animate-float " />
          <img src={hero} alt="icono" className="absolute w-14 top-10 left-12 animate-float-slow" />
          <img src={hero} alt="icono" className="absolute w-20 bottom-0 left-0 animate-float-fast" />
          <img src={hero} alt="icono" className="absolute w-12 bottom-10 right-8 animate-float-fast" />
        </div>
      </section>

      {/* ¿Por qué usar EmprendU? */}
      <section id="porque" className="py-16">
        <h2 className="text-2xl font-bold text-center mb-12">
          ¿Por qué usar EmprendU?
        </h2>
         <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
      <CardLanding
        title="Visibilidad"
        icon={<Eye className="w-8 h-8 text-brand" />}
        description="Da a conocer tu emprendimiento y llega a más personas en tu comunidad y más allá."
      />
      <CardLanding
        title="Conexión"
        icon={<Users className="w-8 h-8 text-brand" />}
        description="Conecta con clientes, colaboradores y aliados estratégicos para hacer crecer tu idea."
      />
      <CardLanding
        title="Crecimiento"
        icon={<TrendingUp className="w-8 h-8 text-brand" />}
        description="Encuentra herramientas, oportunidades y apoyo para impulsar tu emprendimiento."
      />
    </div>
      </section>

      {/* ¿Cómo funciona? */}
      <section className="py-16 bg-white">
        <h2 className="text-2xl font-bold text-center mb-10">¿Cómo funciona?</h2>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-brand/30"></div>

            <div className="relative flex flex-col items-center text-center">
              <div className="bg-brandDark text-white w-12 h-12 rounded-full flex items-center justify-center font-bold z-10">
                1
              </div>
              <h3 className="mt-4 font-semibold">Registra tu emprendimiento</h3>
              <p className="text-gray-600 text-sm mt-2">
                Crea una cuenta y promociona tu idea fácilmente.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="bg-brandDark text-white w-12 h-12 rounded-full flex items-center justify-center font-bold z-10">
                2
              </div>
              <h3 className="mt-4 font-semibold">Gestiona tu información</h3>
              <p className="text-gray-600 text-sm mt-2">
                Organiza tus productos y datos en un panel simple.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="bg-brandDark text-white w-12 h-12 rounded-full flex items-center justify-center font-bold z-10">
                3
              </div>
              <h3 className="mt-4 font-semibold">Conecta con la comunidad</h3>
              <p className="text-gray-600 text-sm mt-2">
                Encuentra oportunidades con la comunidad.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="bg-brandDark text-white w-12 h-12 rounded-full flex items-center justify-center font-bold z-10">
                4
              </div>
              <h3 className="mt-4 font-semibold">Haz crecer tu emprendimiento</h3>
              <p className="text-gray-600 text-sm mt-2">
                Accede a recursos y apoyo para seguir avanzando.
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-10">
            <div className="flex gap-4">
            <Link to="/login">
              <button className="px-6 py-3 border bg-brand text-white rounded-full hover:bg-brandDark transition-colors">
                Comenzar ahora
              </button>
            </Link>
          </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contacto"
        className="bg-brand text-white py-6 rounded-t-2xl"
      >
        <div className="items-center flex flex-col gap-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center px-6 md:px-12 border-b border-white pb-4  w-full">
            <div className="flex align-middle items-center gap-6">
              <img src={footerHero} alt="Logo" className="w-8 p-1 rounded-full" />
              <a href="/faqs" className="text-white text-sm">Preguntas frecuentes</a>
              <a href="/contactUs" className="text-white text-sm">Contáctanos</a>
            </div>
            <div className="flex gap-6">
              <a href=""><img src={x} alt="x socials" className=" h-7" /></a>
              <a href=""><img src={insta} alt="instagram" className=" h-8" /></a>
              <a href=""><img src={youtube} alt="youtube" className=" h-7" /></a>
              <a href=""><img src={tiktok} alt="" className=" h-7"/></a>
            </div>    
          </div>
          <p className="text-sm">© 2025 EmprendU. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
