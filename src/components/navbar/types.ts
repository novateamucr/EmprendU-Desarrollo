import { ReactNode } from 'react';

export type NavLinkItem = {
  type: 'link';
  label: string;
  to: string;
  icon?: ReactNode;
  exact?: boolean;
  visible?: boolean;
};

export type NavDropdownItem = {
  type: 'dropdown';
  label: string;
  icon?: ReactNode;
  align?: 'left' | 'center' | 'right';
  items: Array<
    | { type: 'link'; label: string; to: string; icon?: ReactNode; visible?: boolean }
    | {
        type: 'group';
        label: string;
        items: { label: string; to: string; icon?: ReactNode; visible?: boolean }[];
      }
  >;
  visible?: boolean;
};

export type NavbarItemConfig = NavLinkItem | NavDropdownItem;

export interface NavbarProps {
  logo?: ReactNode;
  items: NavbarItemConfig[];
  rightContent?: ReactNode;
  className?: string;
  sticky?: boolean;
  maxWidth?: 'max-w-3xl' | 'max-w-2xl';
}

export interface DropdownProps {
  item: NavDropdownItem;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNavigate?: () => void;
  isMobile?: boolean;
}

export interface NavbarItemProps {
  item: NavbarItemConfig;
  isMobile?: boolean;
  onNavigate?: () => void;
}
