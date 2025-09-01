import { Link, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';

interface NavbarProps {
  maxWidth?: 'max-w-3xl' | 'max-w-2xl';
}

export function Navbar({ maxWidth = 'max-w-3xl' }: NavbarProps) {
  const location = useLocation();

  const navItems = [
    { name: 'Inicio', href: '/home' },
    { name: 'Emprendimientos', href: '/emprendimientos' },
    { name: 'Ferias', href: '/ferias' },
  ];

  return (
    <nav className={`fixed top-4 left-1/2 transform -translate-x-1/2 ${maxWidth} w-full px-4 z-40`}>
      <div className="bg-white rounded-navbar shadow-soft border border-border px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/src/assets/logo.svg" 
              alt="EmprendeU Logo" 
              className="h-8 w-auto"
            />
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm ${
                  location.pathname === item.href
                    ? 'text-primary'
                    : 'text-secondary'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Profile Icon */}
            <Link
              to="/perfil"
              className={`p-2 rounded-full transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                location.pathname.startsWith('/perfil')
                  ? 'text-primary bg-gray-50'
                  : 'text-secondary'
              }`}
              aria-label="Ir al perfil"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
