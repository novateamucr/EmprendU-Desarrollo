import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { entrepreneurshipApi } from '../../services/entrepreneurshipService';
import { 
  Package, 
  ShoppingBag, 
  Users,
  Pencil,
  AlertTriangle,
  Store,
  Plus,
  Eye
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BusinessSelect } from '../../components/ui/BusinessSelect';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';

import { Entrepreneurship } from '../../services/entrepreneurshipService';

// Type for the business data we get from the API
interface ApiBusiness {
  id: number;
  name: string;
  description: string;
  category: string | number;
  image_url: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  products?: any[];
  [key: string]: any; // For any additional properties
}

// Type for the business data we use in the UI
interface BusinessOption {
  id: string;
  name: string;
  description: string;
  category: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  products_count: number;
  sales_total: number;
  customers_count: number;
  [key: string]: any; // Allow additional properties
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatsCard = ({ title, value, icon, trend }: StatsCardProps) => (
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
      </div>
      <div className="rounded-lg bg-primary/10 p-3 text-primary">
        {icon}
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const { selectedBusiness, setSelectedBusiness } = useBusiness();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's entrepreneurships from the API (guarded and with minimal dependencies)
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const fetchUserBusinesses = async () => {
      try {
        setIsLoading(true);

        // Fetch businesses for the current user with products included
        const businessesResponse = await entrepreneurshipApi.getAll({
          user_id: user.id,
          per_page: 100,
          include: 'products'
        });

        if (!isMounted) return;

        // Handle case where the user has no entrepreneurships
        if (!businessesResponse || !businessesResponse.data || businessesResponse.data.length === 0) {
          setBusinesses([]);
          setSelectedBusiness(null);
          setError(null);
          return;
        }

        // Convert API response to our BusinessOption type
        const businessOptions = businessesResponse.data.map((business: ApiBusiness) => {
          const businessOption: BusinessOption = {
            ...business,
            id: business.id.toString(),
            name: business.name || 'Sin nombre',
            description: business.description || '',
            category: typeof business.category === 'number' ? business.category.toString() : business.category,
            user_id: business.user_id || 0,
            created_at: business.created_at || new Date().toISOString(),
            updated_at: business.updated_at || new Date().toISOString(),
            image_url: business.image_url,
            products_count: business.products?.length || 0,
            sales_total: 0,
            customers_count: 0
          };
          return businessOption;
        });

        setBusinesses(businessOptions);

        // If no business is selected but we have businesses, select the first one (do not override existing selection)
        if (businessOptions.length > 0 && !selectedBusiness) {
          const firstBusiness: Entrepreneurship = {
            id: parseInt(businessOptions[0].id, 10),
            name: businessOptions[0].name,
            description: businessOptions[0].description || '',
            category: businessOptions[0].category as any,
            image_url: businessOptions[0].image_url || null,
            user_id: businessOptions[0].user_id,
            created_at: businessOptions[0].created_at,
            updated_at: businessOptions[0].updated_at,
            products: [],
            owner: { 
              id: businessOptions[0].user_id,
              name: 'Usuario',
              email: 'usuario@ejemplo.com',
              username: `user_${businessOptions[0].user_id}`,
              email_verified_at: null,
              password: 'temporary-password',
              role: 2,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              phone: '',
              province: '',
              canton: '',
              district: '',
              address: '',
              description: '',
              profile_photo_path: null,
              is_active: true
            } as any,
            category_relation: { 
              id: typeof businessOptions[0].category === 'number' ? businessOptions[0].category : 0,
              nombre: businessOptions[0].category?.toString() || 'Sin categoría',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          };
          setSelectedBusiness(firstBusiness);
        }

        setError(null);
      } catch (error: any) {
        if (!isMounted) return;
        console.error('Error loading user businesses:', error);
        if (error?.response?.status === 401) {
          toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          logout();
          navigate('/login');
        } else {
          const errorMessage = error?.response?.data?.message || 'Error al cargar los emprendimientos';
          console.error('API Error:', errorMessage);
          setError(`Error: ${errorMessage}. Intenta recargar la página.`);
          toast.error('No se pudieron cargar tus emprendimientos');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUserBusinesses();
    return () => { isMounted = false; };
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <p className="text-lg font-medium text-gray-700">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  // Convert the selectedBusiness to BusinessOption for the UI
  const currentBusiness = selectedBusiness ? {
    ...selectedBusiness,
    id: selectedBusiness.id.toString(),
    name: selectedBusiness.name || 'Sin nombre',
    description: selectedBusiness.description || '',
    category: (() => {
      if (selectedBusiness.category === undefined) return '';
      if (selectedBusiness.category === null) return '';
      return typeof selectedBusiness.category === 'number' 
        ? selectedBusiness.category.toString() 
        : selectedBusiness.category;
    })(),
    image_url: selectedBusiness.image_url || null,
    products_count: Array.isArray(selectedBusiness.products) ? selectedBusiness.products.length : 0,
    sales_total: 0,
    customers_count: 0,
    user_id: selectedBusiness.user_id || 0,
    created_at: selectedBusiness.created_at || new Date().toISOString(),
    updated_at: selectedBusiness.updated_at || new Date().toISOString()
  } as BusinessOption : null;

  // Early return if no business is selected or no businesses exist
  if (!currentBusiness || businesses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 text-center max-w-3xl mx-auto">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 mb-6">
            <Package className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Aún no tienes emprendimientos</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
            Crea tu primer emprendimiento para comenzar a vender productos y llegar a más clientes en nuestra plataforma.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/entrepreneur/businesses/new" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Crear mi primer emprendimiento
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/explore" className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Ver ejemplos
              </Link>
            </Button>
          </div>
          <div className="mt-10 pt-8 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-4">¿Necesitas ayuda para comenzar?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3 mx-auto">1</div>
                <p className="text-sm text-gray-600">Crea tu perfil de emprendedor</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3 mx-auto">2</div>
                <p className="text-sm text-gray-600">Agrega los detalles de tu negocio</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3 mx-auto">3</div>
                <p className="text-sm text-gray-600">Comienza a vender tus productos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentBusiness || businesses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
            <Store className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No tienes emprendimientos</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Aún no has creado ningún emprendimiento. Crea tu primer emprendimiento para comenzar a vender tus productos.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/entrepreneur/businesses/new" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Crear mi primer emprendimiento
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/explore" className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Explorar emprendimientos
              </Link>
            </Button>
          </div>
        </div>
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
                selectedBusiness={currentBusiness}
                onSelect={(business) => setSelectedBusiness(business)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                asChild
                className="h-[42px] w-[42px] p-0 flex-shrink-0"
              >
                <Link to={`/entrepreneur/businesses/${currentBusiness.id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Productos"
            value={currentBusiness.products_count ?? 0}
            icon={<Package className="h-6 w-6" />}
          />
          <StatsCard
            title="Ventas"
            value={new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(currentBusiness.sales_total ?? 0)}
            icon={<ShoppingBag className="h-6 w-6" />}
          />
          <StatsCard
            title="Clientes"
            value={currentBusiness.customers_count ?? 0}
            icon={<Users className="h-6 w-6" />}
          />
        </div>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Información del emprendimiento</h3>
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
    </div>
  );
}
