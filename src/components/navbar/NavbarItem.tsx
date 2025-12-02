import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dropdown } from './Dropdown';
import { NavbarItemProps } from './types';

export function NavbarItem({ item, isMobile = false, onNavigate }: NavbarItemProps) {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Don't render if not visible
  if (item.visible === false) {
    return null;
  }

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDropdownClose = () => {
    setIsDropdownOpen(false);
  };

  if (item.type === 'link') {
    const isActive = item.exact 
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);

    if (isMobile) {
      return (
        <Link
          to={item.to}
          className={`block px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm ${
            isActive ? 'text-primary dark:text-white bg-gray-50' : 'text-secondary dark:text-secondaryDark'
          }`}
          onClick={() => { if (onNavigate) onNavigate(); }}
        >
          <div className="flex items-center space-x-2">
            {item.icon}
            <span>{item.label}</span>
          </div>
        </Link>
      );
    }

    return (
      <Link
        to={item.to}
        className={`text-sm font-medium transition-colors hover:text-primary hover:underline hover:underline-offset-4 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm ${
          isActive ? 'text-primary dark:text-white' : 'text-secondary dark:text-secondaryDark'
        }`}
      >
        <div className="flex items-center space-x-1">
          {item.icon}
          <span>{item.label}</span>
        </div>
      </Link>
    );
  }

  if (item.type === 'dropdown') {
    return (
      <Dropdown
        item={item}
        isOpen={isDropdownOpen}
        onToggle={handleDropdownToggle}
        onClose={handleDropdownClose}
        isMobile={isMobile}
        onNavigate={onNavigate}
      />
    );
  }

  return null;
}
