import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { Link } from "react-router-dom";

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

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const items = [
    { label: "Nosotros", href: "/nosotros" },
    { label: "Contacto", href: "/contacto" },
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
    <>
      <AnimatedNav className="fixed top-4 left-1/2 transform -translate-x-1/2 max-w-3xl w-full px-4 z-40">
        <div className="bg-white dark:bg-cardDark rounded-[16px] shadow-soft border border-border dark:border-cardDark px-6 py-3 h-14 flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary dark:text-white">MiLogo</span>
            </div>

            {/* Navegación Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              {items.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="text-secondary dark:text-secondaryDark hover:text-brand dark:hover:text-brandDark font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Botón menú móvil */}
            <div className="flex items-center space-x-4">
              <HoverButton
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-brand/10 dark:hover:bg-brandDark/20 focus:outline-none focus:ring-2 focus:ring-brand dark:focus:ring-brandDark focus:ring-offset-2 dark:focus:ring-offset-cardDark"
                aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-secondary dark:text-secondaryDark" />
                ) : (
                  <Menu className="w-5 h-5 text-secondary dark:text-secondaryDark" />
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
          {/* Fondo oscuro */}
          <div
            className="fixed inset-0 bg-primary dark:bg-black bg-opacity-50 dark:bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Panel menú */}
          <AnimatedMobileMenu className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-cardDark shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border dark:border-cardDark">
              <span className="text-xl font-bold text-primary dark:text-white">MiLogo</span>
              <HoverButton
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-brand/10 dark:hover:bg-brandDark/20 focus:outline-none focus:ring-2 focus:ring-brand dark:focus:ring-brandDark focus:ring-offset-2 dark:focus:ring-offset-cardDark"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5 text-secondary dark:text-secondaryDark" />
              </HoverButton>
            </div>

            {/* Opciones */}
            <div className="py-4 space-y-1">
              {items.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-6 py-3 text-secondary dark:text-secondaryDark hover:bg-brand/10 dark:hover:bg-brandDark/20 hover:text-brand dark:hover:text-brandDark font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </AnimatedMobileMenu>
        </div>
      )}
    </>
  );
}
