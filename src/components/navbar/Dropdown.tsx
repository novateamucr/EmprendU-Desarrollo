import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { DropdownProps } from './types';

export function Dropdown({ item, isOpen, onToggle, onClose, isMobile = false, onNavigate }: DropdownProps) {
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter visible items
  const visibleItems = item.items.filter(dropdownItem => {
    if (dropdownItem.type === 'link') {
      return dropdownItem.visible !== false;
    }
    if (dropdownItem.type === 'group') {
      const visibleGroupItems = dropdownItem.items.filter(groupItem => groupItem.visible !== false);
      return visibleGroupItems.length > 0;
    }
    return true;
  });

  // Check if any dropdown item is active
  const isActive = visibleItems.some(dropdownItem => {
    if (dropdownItem.type === 'link') {
      return location.pathname === dropdownItem.to;
    }
    if (dropdownItem.type === 'group') {
      return dropdownItem.items.some(groupItem => location.pathname === groupItem.to);
    }
    return false;
  });

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, isMobile]);

  const handleMouseEnter = () => {
    if (!isMobile) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
        onClose();
      }, 150); // 150ms delay to allow moving to dropdown menu
    }
  };

  const shouldShowDropdown = isMobile ? isOpen : (isOpen || isHovered);

  if (isMobile) {
    // Mobile accordion style
    return (
      <div className="w-full">
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-brand/10 focus-brand rounded-sm ${
            isActive ? 'text-primary' : 'text-secondary'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <div className="flex items-center space-x-2">
            {item.icon}
            <span>{item.label}</span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        
        {isOpen && (
          <div className="pl-6 py-2 space-y-1 bg-brand/5 rounded-sm">
            {visibleItems.map((dropdownItem, index) => (
              <div key={index}>
                {dropdownItem.type === 'link' ? (
                  <Link
                    to={dropdownItem.to}
                    className={`block px-4 py-2 text-sm transition-colors hover:bg-white hover:text-primary focus-brand rounded-sm ${
                      location.pathname === dropdownItem.to
                        ? 'text-primary bg-white'
                        : 'text-secondary'
                    }`}
                    onClick={() => { onClose(); if (onNavigate) onNavigate(); }}
                  >
                    <div className="flex items-center space-x-2">
                      {dropdownItem.icon}
                      <span>{dropdownItem.label}</span>
                    </div>
                  </Link>
                ) : (
                  <div className="py-2">
                    <div className="px-4 py-1 text-xs font-semibold text-secondary uppercase tracking-wider">
                      {dropdownItem.label}
                    </div>
                    <div className="space-y-1">
                      {dropdownItem.items
                        .filter(groupItem => groupItem.visible !== false)
                        .map((groupItem, groupIndex) => (
                          <Link
                            key={groupIndex}
                            to={groupItem.to}
                            className={`block px-4 py-2 text-sm transition-colors hover:bg-white hover:text-primary focus-brand rounded-sm ${
                              location.pathname === groupItem.to
                                ? 'text-primary bg-white'
                                : 'text-secondary'
                            }`}
                            onClick={() => { onClose(); if (onNavigate) onNavigate(); }}
                          >
                            <div className="flex items-center space-x-2">
                              {groupItem.icon}
                              <span>{groupItem.label}</span>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop dropdown
  return (
    <div 
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={onToggle}
        onFocus={() => !isMobile && setIsHovered(true)}
        onBlur={() => !isMobile && setTimeout(() => setIsHovered(false), 100)}
        className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary hover:underline hover:underline-offset-4 focus-brand rounded-sm ${
          isActive ? 'text-primary' : 'text-secondary'
        }`}
        aria-expanded={shouldShowDropdown}
        aria-haspopup="menu"
        role="button"
      >
        <div className="flex items-center space-x-1">
          {item.icon}
          <span>{item.label}</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${shouldShowDropdown ? 'rotate-180' : ''}`}
        />
      </button>

      {shouldShowDropdown && (
        <div 
          className={`absolute top-full mt-2 min-w-48 bg-white border border-border rounded-card shadow-soft py-2 z-50 transition-all duration-200 ease-out ${
            item.align === 'right' ? 'right-0' : item.align === 'center' ? 'left-1/2 transform -translate-x-1/2' : 'left-0'
          } opacity-100 scale-100`}
          role="menu"
          aria-orientation="vertical"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {visibleItems.map((dropdownItem, index) => (
            <div key={index}>
              {dropdownItem.type === 'link' ? (
                <Link
                  to={dropdownItem.to}
                  className={`block px-4 py-2 text-sm transition-colors hover:bg-brand/10 hover:text-primary focus:bg-brand/10 focus:text-primary ${
                    location.pathname === dropdownItem.to
                      ? 'text-primary bg-brand/10'
                      : 'text-secondary'
                  }`}
                  role="menuitem"
                  onClick={onClose}
                >
                  <div className="flex items-center space-x-2">
                    {dropdownItem.icon}
                    <span>{dropdownItem.label}</span>
                  </div>
                </Link>
              ) : (
                <div className="py-2">
                  {index > 0 && <div className="border-t border-border mx-4 mb-2" />}
                  <div className="px-4 py-1 text-xs font-semibold text-secondary uppercase tracking-wider">
                    {dropdownItem.label}
                  </div>
                  <div className="space-y-1">
                    {dropdownItem.items
                      .filter(groupItem => groupItem.visible !== false)
                      .map((groupItem, groupIndex) => (
                        <Link
                          key={groupIndex}
                          to={groupItem.to}
                          className={`block px-4 py-2 text-sm transition-colors hover:bg-brand/10 hover:text-primary focus:bg-brand/10 focus:text-primary ${
                            location.pathname === groupItem.to
                              ? 'text-primary bg-brand/10'
                              : 'text-secondary'
                          }`}
                          role="menuitem"
                          onClick={onClose}
                        >
                          <div className="flex items-center space-x-2">
                            {groupItem.icon}
                            <span>{groupItem.label}</span>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
