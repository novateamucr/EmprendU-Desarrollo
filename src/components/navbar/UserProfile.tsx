import { useState, useEffect, useRef } from 'react';
import { User, LogOut, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitch } from '../ui/ThemeSwitch';

export function UserProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout, user, isEntrepreneur, isRegularUser } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    // Close on escape key
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-brand dark:focus:ring-brandDark focus:ring-offset-2 dark:focus:ring-offset-cardDark rounded-full p-1"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name || 'Avatar'}
            className="w-8 h-8 rounded-full object-cover border border-border dark:border-cardDark"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand/20 dark:bg-brandDark/20 flex items-center justify-center text-brandDark dark:text-brandDark font-semibold text-sm select-none">
            {(user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-cardDark rounded-lg shadow-lg py-1 z-50 border border-gray-100 dark:border-cardDark ">
          <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100 dark:border-secondaryDark/60">
            <p className="font-medium dark:text-white">Mi Cuenta</p>
          </div>
          <button
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-secondaryDark hover:bg-gray-50 dark:hover:bg-brandDark/20 w-full text-left transition-colors"
            onClick={() => { setIsOpen(false); navigate('/profile'); }}
            aria-label="Ir al perfil"
            role="menuitem"
          >
            <User size={16} className="mr-2" />
            Perfil
          </button>
          {(isEntrepreneur || isRegularUser) && (
            <button
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-secondaryDark hover:bg-gray-50 dark:hover:bg-brandDark/20 w-full text-left transition-colors"
              onClick={() => { setIsOpen(false); navigate('/orders'); }}
              aria-label="Ir a mis pedidos"
              role="menuitem"
            >
              <Package size={16} className="mr-2" />
              Mis pedidos
            </button>
          )}

          <div className="flex items-center justify-between px-4 py-2 text-sm 
                    text-gray-700 dark:text-secondaryDark border-t border-gray-100 dark:border-secondaryDark/60">
            <span>Modo oscuro</span>
            <ThemeSwitch />
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              logout();
              navigate('/login');
            }}
            className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-red-500/10 w-full text-left transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
