import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { NavbarItem } from './NavbarItem';
import { NavbarProps } from './types';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// Soft animations for navbar
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

const AnimatedNav = styled.nav`
  /* Removed load animation to prevent bugs */
`;

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

export function Navbar({ 
  logo, 
  items, 
  rightContent, 
  className = '', 
  sticky = true,
  maxWidth = 'max-w-3xl'
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter visible items
  const visibleItems = items.filter(item => item.visible !== false);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isMobileMenuOpen]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <AnimatedNav 
        className={`${sticky ? 'fixed top-4 left-1/2 transform -translate-x-1/2' : ''} ${maxWidth} w-full px-4 z-40 ${className}`}
      >
        <div className="bg-white dark:bg-cardDark rounded-[16px] shadow-soft border border-border dark:border-cardDark px-6 py-3 h-14 flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Logo */}
            <div className="flex items-center">
              {logo}
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {visibleItems.map((item, index) => (
                <NavbarItem key={index} item={item} />
              ))}
            </div>

            {/* Right Content & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* Right Content - Always visible */}
              {rightContent && (
                <div className="flex items-center">
                  {rightContent}
                </div>
              )}
              
              {/* Mobile Menu Button */}
              {visibleItems.length > 0 && (
                <HoverButton
                  onClick={toggleMobileMenu}
                  className="md:hidden p-2 rounded-full transition-colors hover:bg-brand/10 focus-brand"
                  aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 text-secondary dark:text-secondaryDark" />
                  ) : (
                    <Menu className="w-5 h-5 text-secondary" />
                  )}
                </HoverButton>
              )}
            </div>
          </div>
        </div>
      </AnimatedNav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-primary bg-opacity-50 transition-opacity"
            onClick={closeMobileMenu}
          />
          
          {/* Mobile Menu Panel */}
          <AnimatedMobileMenu className="fixed top-0 right-0 h-full w-80 max-w-sm bg-white shadow-xl transform transition-transform">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center">
                {logo}
              </div>
              <HoverButton
                onClick={closeMobileMenu}
                className="p-2 rounded-full transition-colors hover:bg-brand/10 focus-brand"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5 text-secondary" />
              </HoverButton>
            </div>
            
            {/* Mobile Menu Items */}
            <div className="py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
              {visibleItems.map((item, index) => (
                <div key={index}>
                  <NavbarItem item={item} isMobile onNavigate={closeMobileMenu} />
                </div>
              ))}
            </div>
            
            {/* Mobile Menu Footer */}
            {rightContent && (
              <div className="border-t border-border p-6">
                <div className="flex justify-center">
                  {rightContent}
                </div>
              </div>
            )}
          </AnimatedMobileMenu>
        </div>
      )}
    </>
  );
}
