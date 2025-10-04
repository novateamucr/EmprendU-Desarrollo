import { ReactNode } from 'react';
import { Navbar } from '../navbar';
import { UserProfile } from '../navbar/UserProfile';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { getItemCount } = useCart();
  const cartItemCount = getItemCount();
  
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
      label: 'Ferias y Actividades', 
      to: '/ferias/actividades',
      
      visible: user?.role === 1
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
      label: 'Ferias y Actividades', 
      to: '/ferias',
      // Only show to entrepreneurs (role 2)
      visible: user?.role === 2
    },
    { 
      type: 'link' as const, 
      label: 'Gestor de Usuarios', 
      to: '/admin/usuarios',
      // Only show to admins (role 3)
      visible: user?.role === 3
    },
    { 
      type: 'link' as const, 
      label: 'Gestor de Emprendimientos', 
      to: '/admin/emprendimientos',
      // Only show to admins (role 3)
      visible: user?.role === 3
    },
  ];

  const rightContent = (
    <div className="flex items-center gap-2">
      <Link
        to="/cart"
        className="relative p-2 rounded-full hover:bg-brand/10 transition-colors focus-brand"
        aria-label="Ir al carrito"
      >
        <ShoppingCart className="w-5 h-5 text-secondary" />
        {cartItemCount > 0 && (
          <span
            aria-label="Total de productos en el carrito"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-semibold flex items-center justify-center"
          >
            {cartItemCount}
          </span>
        )}
      </Link>
      <UserProfile />
    </div>
  );

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
