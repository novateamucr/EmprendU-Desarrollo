import { ReactNode } from 'react';
import { Navbar } from '../navbar';
import { UserProfile } from '../navbar/UserProfile';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, Store } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import emprendULogo from '../../assets/logo.svg';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { getItemCount, showJustAdded } = useCart();
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
      type: 'dropdown' as const,
      label: 'Mis Emprendimientos',
      items: [
        {
          type: 'link' as const,
          label: 'Dashboard',
          to: '/entrepreneur',
          icon: <LayoutDashboard size={16} />,
          visible: user?.role === 2
        },
        {
          type: 'link' as const,
          label: 'Mis emprendimientos',
          to: '/entrepreneur/businesses',
          icon: <Store size={16} />,
          visible: user?.role === 2
        }
      ],
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
      label: 'Dashboard', 
      to: '/admin/dashboard',
      // Only show to admins (role 3)
      visible: user?.role === 3
    },
    {
      type: 'dropdown' as const,
      label: 'Gestión',
      items: [
        { 
          type: 'link' as const, 
          label: 'CRUD Usuarios', 
          to: '/admin/usuarios',
          // Only show to admins (role 3)
          visible: user?.role === 3
        },
        { 
          type: 'link' as const, 
          label: 'CRUD Emprendimientos', 
          to: '/admin/emprendimientos',
          // Only show to admins (role 3)
          visible: user?.role === 3
        },
        { 
          type: 'link' as const, 
          label: 'CRUD Productos', 
          to: '/admin/productos',
          // Only show to admins (role 3)
          visible: user?.role === 3
        },
        { 
          type: 'link' as const, 
          label: 'CRUD Ferias', 
          to: '/admin/ferias',
          // Only show to admins (role 3)
          visible: user?.role === 3
        },
    ],
      visible: user?.role === 3
    },
  ];

  const rightContent = (
    <div className="flex items-center gap-2">
      {user?.role !== 3 && (
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
      )}
      <UserProfile />
    </div>
  );

  const logo = (
    <Link 
      to={user?.role === 3 ? '/admin/dashboard' : '/home'} 
      className="flex items-center"
      aria-label={user?.role === 3 ? 'Ir al panel de administración' : 'Ir al inicio'}
    >
      <img src={emprendULogo} alt="EmprendeU Logo" className="h-8 w-auto" />
    </Link>
  );

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-100">
      <Navbar
        logo={logo}
        items={navItems.filter(item => item.visible === undefined || item.visible)}
        rightContent={rightContent}
        className="w-full z-50"
      />
      {/* Pulsating bubble notification */}
      {showJustAdded && (
        <div
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="relative rounded-full bg-brand text-white shadow-lg px-4 py-2 flex items-center gap-2 border border-white/40">
            <span className="absolute inset-0 rounded-full animate-ping bg-brand/40" aria-hidden="true"></span>
            <span className="relative z-10 text-sm font-semibold">Pedido agregado al carrito</span>
          </div>
        </div>
      )}
      <main className="flex-1 w-full overflow-auto">
        <div className="max-w-full mx-auto w-full h-full px-8 pt-6 pb-0 flex flex-col min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
