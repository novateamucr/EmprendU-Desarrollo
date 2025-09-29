import { ReactNode } from 'react';
import { Navbar } from '../navbar';
import { UserProfile } from '../navbar/UserProfile';
import { useAuth } from '../../context/AuthContext';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  
  const navItems = [
   
    { 
      type: 'link' as const, 
      label: 'Inicio', 
      to: '/home',
      // Only show to entrepreneurs (role 2) and clients (role 1)
      visible: user?.role === 2 || user?.role === 1
    },
    { 
      type: 'link' as const, 
      label: 'Mis Emprendimientos', 
      to: '/entrepreneur',
      // Only show to entrepreneurs (role 2)
      visible: user?.role === 2
    },
    { 
      type: 'link' as const, 
      label: 'Gestor de Usuarios', 
      to: '/gestor-usuarios',
      // Only show to admins (role 3)
      visible: user?.role === 3
    },
    { 
      type: 'link' as const, 
      label: 'Gestor de Emprendimientos', 
      to: '/gestor-emprendimientos',
      // Only show to admins (role 3)
      visible: user?.role === 3
    },
  ];

  const rightContent = <UserProfile />;

  const logo = (
      <img src="/src/assets/logo.svg" alt="EmprendeU Logo" className="h-8 w-auto" />
  );

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-100">
      <Navbar
        logo={logo}
        items={navItems.filter(item => item.visible === undefined || item.visible)}
        rightContent={rightContent}
        className="w-full z-50"
      />
      <main className="flex-1 w-full overflow-auto">
        <div className="max-w-7xl mx-auto w-full h-full px-4 py-6  ">
          {children}
        </div>
      </main>
    </div>
  );
}
