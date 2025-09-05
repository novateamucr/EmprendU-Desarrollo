import { useState, useEffect, useRef } from 'react';
import { User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UserProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full p-1"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User size={18} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100">
          <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
            <p className="font-medium">Mi Cuenta</p>
          </div>
          <Link
            to="/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
            onClick={() => setIsOpen(false)}
          >
            <User size={16} className="mr-2" />
            Perfil
          </Link>
          <Link
            to="/logout"
            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full text-left"
            onClick={() => setIsOpen(false)}
          >
            <LogOut size={16} className="mr-2" />
            Cerrar sesión
          </Link>
        </div>
      )}
    </div>
  );
}
