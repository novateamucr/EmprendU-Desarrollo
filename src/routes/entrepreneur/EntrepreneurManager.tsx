import { useState } from 'react';
import { Outlet, useNavigate, Routes, Route } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Package, 
  Settings, 
  Plus,
  ArrowLeft,
  PackageOpen
} from 'lucide-react';
import { Button } from '../../components/Button';
import BusinessList from './components/BusinessList';
import BusinessSetup from './components/BusinessSetup';
import BusinessForm from './components/BusinessForm';
import Dashboard from './Dashboard';
import InventoryPage from './inventory/InventoryPage';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
};

export default function EntrepreneurManager() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/entrepreneur' },
    { id: 'businesses', label: 'Mis emprendimientos', icon: <Store size={20} />, path: '/entrepreneur/businesses' },
    { id: 'new-business', label: 'Nuevo emprendimiento', icon: <Plus size={20} />, path: '/entrepreneur/businesses/new' },
    { id: 'inventory', label: 'Inventario', icon: <PackageOpen size={20} />, path: '/entrepreneur/inventory' },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen w-full ">
      {/* Sidebar */}
      <div 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex-shrink-0 fixed h-full`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          {isSidebarOpen && <h1 className="text-xl font-bold text-primary">Emprendedor</h1>}
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ArrowLeft 
              className={`w-5 h-5 text-gray-500 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-primary/10 text-left ${
                window.location.pathname === item.path ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {isSidebarOpen && (
          <div className="p-4 border-t border-gray-200 mt-auto">
        
          </div>
        )}
      </div>

      {/* Main Content - Full Width */}
      <div className="flex-1 ml-0 transition-all duration-300 mt-6" style={{ marginLeft: isSidebarOpen ? '16rem' : '5rem' }}>
        <div className="w-full h-full overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="businesses" element={<BusinessList />} />
            <Route path="businesses/new" element={<BusinessForm />} />
            <Route path="businesses/:id" element={<BusinessSetup />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Routes>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
