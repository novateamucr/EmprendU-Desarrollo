import { ReactNode } from 'react';
import { Navbar } from '../navbar';
import { UserProfile } from '../navbar/UserProfile';
import { Link } from 'react-router-dom';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const navItems = [
    { type: 'link' as const, label: 'Inicio', to: '/' },
    { type: 'link' as const, label: 'Emprendimientos', to: '/feed/emprendimiento' },
    { type: 'link' as const, label: 'Ferias', to: '/ferias' },
    { type: 'link' as const, label: 'Mis Emprendimientos', to: '/entrepreneur' },
  ];

  const rightContent = <UserProfile />;

  const logo = (
    <Link to="/" className="flex items-center">
      <img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        logo={logo}
        items={navItems}
        rightContent={rightContent}
        className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm"
      />
      <main className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
