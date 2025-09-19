import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingBag, 
  Users,
  Plus,
  Pencil,
  AlertTriangle,
  ArrowRight,
  Store,
  TrendingUp
} from 'lucide-react';
import { entrepreneurshipApi } from '../../services/entrepreneurshipService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BusinessSelect } from '../../components/ui/BusinessSelect';
import { useBusiness } from '../../context/BusinessContext';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  link?: string;
  linkText?: string;
}

const StatsCard = ({ title, value, icon, trend, link, linkText }: StatsCardProps) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        {trend && (
          <p className={`mt-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value} respecto al mes pasado
          </p>
        )}
        {link && linkText && (
          <Button variant="link" className="mt-2 p-0 h-auto" asChild>
            <Link to={link}>
              {linkText} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
      <div className="rounded-lg bg-primary/10 p-3 text-primary">
        {icon}
      </div>
    </div>
  </Card>
);

interface BusinessOption {
  id: string;
  name: string;
}

export default function Dashboard() {
  const { selectedBusiness, setSelectedBusiness, loading, error, refreshBusiness } = useBusiness();
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalCustomers: 0,
    loading: true,
    error: null as string | null,
  });

  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  // Load businesses for the dropdown
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setIsLoadingBusinesses(true);
        const response = await entrepreneurshipApi.getAll({ per_page: 100 });
        if (response?.data) {
          const businessOptions = response.data.map(business => ({
            id: business.id.toString(),
            name: business.name,
            image_url: business.image_url
          }));
          setBusinesses(businessOptions);
          
          // If there's no selected business but we have businesses, select the first one
          if (!selectedBusiness && businessOptions.length > 0) {
            setSelectedBusiness(response.data[0]);
          }
        }
      } catch (err) {
        console.error('Error loading businesses:', err);
      } finally {
        setIsLoadingBusinesses(false);
      }
    };

    fetchBusinesses();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!selectedBusiness) {
          setStats(prev => ({
            ...prev,
            loading: false,

            error: 'No se ha seleccionado ningún emprendimiento',
          }));
          return;
        }

        // In a real app, you would fetch this from an API endpoint
        // that returns all the dashboard data at once for the selected business
        // For now, we'll use mock data
        setStats({
          totalProducts: 42, // This would come from your API
          totalSales: 1289, // This would come from your API
          totalCustomers: 356, // This would come from your API
          loading: false,
          error: null,
        });

        // Mock data for recent products
        const mockProducts = [
          {
            id: '1',
            name: 'Camiseta Básica Blanca',
            business: selectedBusiness.name,
            stock: 15,
            status: 'active',
          },
          {
            id: '2',
            name: 'Jeans Slim Fit Azul',
            business: selectedBusiness.name,
            stock: 8,
            status: 'active',
          },
          {
            id: '3',
            name: 'Zapatos Deportivos',
            business: selectedBusiness.name,
            stock: 0,
            status: 'out_of_stock',
          },
        ];
        
        setRecentProducts(mockProducts);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Error al cargar los datos del dashboard',
        }));
      }
    };

    fetchDashboardData();
  }, [selectedBusiness]);

  if (loading || stats.loading || isLoadingBusinesses) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || stats.error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <p className="text-lg font-medium text-gray-700">
          {error || stats.error}
        </p>
        <Button onClick={refreshBusiness}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!selectedBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Store className="h-12 w-12 text-gray-400" />
        <p className="text-lg font-medium text-gray-700">
          No hay ningún emprendimiento seleccionado

        </p>
        <Button asChild>
          <Link to="/entrepreneur/businesses">
            Ver mis emprendimientos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 px-4 sm:px-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
          <div className="w-full max-w-2xl">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">

              Seleccionar emprendimiento

            </label>
            <div className="flex items-start gap-3">
              <BusinessSelect
                businesses={businesses}
                selectedBusiness={selectedBusiness ? {
                  id: selectedBusiness.id.toString(),
                  name: selectedBusiness.name,
                  image_url: selectedBusiness.image_url
                } : null}
                onSelect={(business) => {
                  const selected = businesses.find(b => b.id === business.id);
                  if (selected) {
                    setSelectedBusiness(selected as any);
                  }
                }}
                loading={isLoadingBusinesses}
                className="flex-1"
              />
              {selectedBusiness && (
                <Button 
                  variant="outline" 
                  asChild
                  className="h-[42px] w-[42px] p-0 flex-shrink-0"
                >
                  <Link to={`/entrepreneur/businesses/${selectedBusiness.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Productos"
            value={stats.totalProducts}
            icon={<Package className="h-6 w-6" />}
            trend={{ value: '12%', isPositive: true }}
            link="/entrepreneur/inventory"
            linkText="Ver inventario"
          />
          <StatsCard
            title="Ventas"
            value={new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(stats.totalSales)}
            icon={<ShoppingBag className="h-6 w-6" />}
            trend={{ value: '5%', isPositive: true }}
          />
          <StatsCard
            title="Clientes"
            value={stats.totalCustomers}
            icon={<Users className="h-6 w-6" />}
            trend={{ value: '8%', isPositive: true }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Información del emrpendimiento</h3>

            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                {selectedBusiness.image_url ? (
                  <img 
                    src={selectedBusiness.image_url} 
                    alt={selectedBusiness.name}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                    <Store className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium">{selectedBusiness.name}</h4>
                  <p className="text-sm text-gray-500">
                    {selectedBusiness.description || 'Sin descripción'}
                  </p>
                  {selectedBusiness.address && (
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedBusiness.address}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {selectedBusiness.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <p>{selectedBusiness.phone}</p>
                  </div>
                )}
                {selectedBusiness.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p>{selectedBusiness.email}</p>
                  </div>
                )}
                {selectedBusiness.website && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Sitio web</p>
                    <a 
                      href={selectedBusiness.website.startsWith('http') ? selectedBusiness.website : `https://${selectedBusiness.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedBusiness.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Productos con Stock Bajo</h3>
              <Button variant="ghost" asChild>
                <Link to="/entrepreneur/inventory" className="text-sm">
                  Ver inventario
                </Link>
              </Button>
            </div>
            
            {recentProducts.length > 0 ? (
              <div className="space-y-4">
                {recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.status === 'out_of_stock' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.status === 'out_of_stock' ? 'Sin stock' : `Stock: ${product.stock}`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{product.business}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/entrepreneur/inventory/${product.id}`}>
                        Reponer
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Todos tus productos tienen suficiente stock</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Actividad Reciente</h3>
            <Button variant="ghost" asChild>
              <Link to="/entrepreneur/activity" className="text-sm">
                Ver toda la actividad
              </Link>
            </Button>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {item === 1 && <ShoppingBag className="h-5 w-5" />}
                  {item === 2 && <Users className="h-5 w-5" />}
                  {item === 3 && <TrendingUp className="h-5 w-5" />}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {item === 1 && 'Nueva orden recibida #ORD-12345'}
                    {item === 2 && 'Nuevo cliente registrado'}
                    {item === 3 && '¡Tu emrpendimiento ha sido destacado!'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item === 1 && 'Se ha realizado un pedido en tu tienda de ropa'}
                    {item === 2 && 'María González se ha registrado en tu emrpendimiento'}
                    {item === 3 && 'Tu emrpendimiento ahora aparece en la página principal'}

                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {item === 1 && 'Hace 2 horas'}
                    {item === 2 && 'Ayer a las 14:30'}
                    {item === 3 && '15 de oct, 2023'}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Ver detalles
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-32 flex-col items-center justify-center space-y-2">
          <Plus className="h-6 w-6 text-primary" />
          <span>Agregar Producto</span>
        </Button>
        <Button variant="outline" className="h-32 flex-col items-center justify-center space-y-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span>Ver Pedidos</span>
        </Button>
        <Button variant="outline" className="h-32 flex-col items-center justify-center space-y-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span>Ver Reportes</span>
        </Button>
        <Button variant="outline" className="h-32 flex-col items-center justify-center space-y-2">
          <Users className="h-6 w-6 text-primary" />
          <span>Clientes</span>
        </Button>
      </div>
    </div>
  );
}
