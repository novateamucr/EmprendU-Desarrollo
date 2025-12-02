import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Search, Store, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BusinessOption {
  id: string;
  name: string;
  image_url?: string | null;
}

interface BusinessSelectProps {
  businesses: BusinessOption[];
  selectedBusiness: BusinessOption | null;
  onSelect: (business: BusinessOption) => void;
  loading?: boolean;
  className?: string;
  placeholder?: string;
}

export function BusinessSelect({
  businesses,
  selectedBusiness,
  onSelect,
  loading = false,
  className,
  placeholder = 'Seleccionar negocio'
}: BusinessSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={cn('relative w-full', className)} ref={dropdownRef}>
      <button
        type="button"
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left bg-white border border-gray-200 rounded-lg shadow-sm',
          'hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'transition-all duration-200',
          'dark:bg-modalDark dark:border-cardDark dark:text-white',
          isOpen && 'ring-2 ring-primary-500 border-transparent'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center min-w-0">
          {selectedBusiness ? (
            <>
              {selectedBusiness.image_url ? (
                <img
                  src={selectedBusiness.image_url}
                  alt=""
                  className="flex-shrink-0 h-8 w-8 rounded-md object-cover"
                />
              ) : (
                <div className="flex-shrink-0 h-8 w-8 rounded-md bg-primary-50 flex items-center justify-center dark:bg-brandDark/20">
                  <Store className="h-4 w-4 text-primary-600 dark:text-brandDark" />
                </div>
              )}
              <span className="ml-3 block truncate font-medium text-gray-900 dark:text-white">
                {selectedBusiness.name}
              </span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-secondaryDark">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-gray-400 transition-transform duration-200 dark:text-secondaryDark',
            isOpen && 'transform rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg dark:bg-cardDark dark:border dark:border-cardDark">
          <div className="p-2 border-b dark:border-gray-600">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-secondaryDark" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-cardDark dark:border-gray-600 dark:text-white dark:placeholder-secondaryDark"
                placeholder="Buscar negocio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-auto py-1 dark:bg-cardDark">
            {loading ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-secondaryDark">Cargando...</div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-secondaryDark">
                {searchTerm ? 'No se encontraron coincidencias' : 'No hay negocios disponibles'}
              </div>
            ) : (
              <ul className="py-1 dark:bg-cardDark">
                {filteredBusinesses.map((business) => (
                  <li key={business.id} className="group">
                    <button
                      type="button"
                      className={cn(
                        'w-full flex items-center px-4 py-2 text-sm text-left hover:bg-primary-50 dark:text-white dark:hover:bg-gray-700',
                        selectedBusiness?.id === business.id && 'bg-primary-50 dark:bg-gray-700'
                      )}
                      onClick={() => {
                        onSelect(business);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      {business.image_url ? (
                        <img
                          src={business.image_url}
                          alt=""
                          className="h-8 w-8 rounded-md object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-primary-50 flex items-center justify-center flex-shrink-0 dark:bg-brandDark/20">
                          <Store className="h-4 w-4 text-primary-600 dark:text-brandDark" />
                        </div>
                      )}
                      <span className="ml-3 block truncate dark:text-white">{business.name}</span>
                      {selectedBusiness?.id === business.id && (
                        <Check className="ml-auto h-5 w-5 text-primary-600 dark:text-brandDark" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-600">
            <a
              href="/entrepreneur/business/setup"
              className="flex items-center text-sm text-primary-600 hover:text-primary-800 font-medium dark:text-brandDark dark:hover:text-blue-400"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear nuevo emprendimiento
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
