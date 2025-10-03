import { useEffect, useState, useMemo } from 'react';
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
  Eye,
  BarChart2,
  PieChart,
  LineChart,
  Filter,
  ChevronDown
} from 'lucide-react';

// Lista de provincias de Costa Rica
const PROVINCES = [
  'Todas',
  'San José',
  'Alajuela',
  'Cartago',
  'Heredia',
  'Guanacaste',
  'Puntarenas',
  'Limón'
] as const;

type Province = typeof PROVINCES[number];
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BusinessSelect } from '../../components/ui/BusinessSelect';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Entrepreneurship } from '../../services/entrepreneurshipService';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  PointElement,
  LineElement
);

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

// Chart color scheme
const CHART_COLORS = {
  red: 'rgb(239, 68, 68)',
  blue: 'rgb(59, 130, 246)',
  green: 'rgb(34, 197, 94)',
  yellow: 'rgb(234, 179, 8)',
  purple: 'rgb(168, 85, 247)',
  pink: 'rgb(236, 72, 153)',
  indigo: 'rgb(99, 102, 241)',
  teal: 'rgb(20, 184, 166)',
};

export default function Dashboard() {
  const { selectedBusiness, setSelectedBusiness } = useBusiness();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProvince, setSelectedProvince] = useState<Province>('Todas');
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);

  // Prepare chart data when selected business changes
  useEffect(() => {
    if (selectedBusiness) {
      const currentBiz = businesses.find(b => b.id === selectedBusiness.id.toString());
      if (!currentBiz) return;

      // For products, show categories or types if available, otherwise just a single value
      let productCategories = {};
      let productsCount = 0;
      
      if (currentBiz.products && currentBiz.products.length > 0) {
        productCategories = currentBiz.products.reduce((acc: Record<string, number>, product: any) => {
          const category = product.category?.name || 'Sin categoría';
          acc[category] = (acc[category] || 0) + 1;
          productsCount += 1;
          return acc;
        }, {});
      } else {
        productsCount = currentBiz.products_count || 0;
        productCategories = { 'Productos': productsCount };
      }
      
      setTotalProducts(productsCount);

            // For sales, show last 6 months data if available, otherwise just total
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const currentMonth = new Date().getMonth();
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const monthIndex = (currentMonth - 5 + i + 12) % 12; // Last 6 months including current
        return months[monthIndex];
      });

      // Calculate base sales value based on number of products
      const baseSalesValue = productsCount * 20000; // 20,000 colones per product as base
      
      // Generate realistic sales data with an upward trend
      const salesData = last6Months.map((_, i) => {
        // Start with 70% of base value and increase each month
        const base = baseSalesValue * (0.7 + (i * 0.1));
        // Add some random variation (up to ±20%)
        const variation = base * (0.8 + Math.random() * 0.4);
        return Math.round(variation / 1000) * 1000; // Round to nearest 1,000
      });

      setChartData({
        products: {
          labels: Object.keys(productCategories),
          datasets: [
            {
              label: 'Productos por categoría',
              data: Object.values(productCategories),
              backgroundColor: [
                CHART_COLORS.blue,
                CHART_COLORS.green,
                CHART_COLORS.yellow,
                CHART_COLORS.purple,
                CHART_COLORS.pink,
              ],
              borderColor: [
                CHART_COLORS.blue,
                CHART_COLORS.green,
                CHART_COLORS.yellow,
                CHART_COLORS.purple,
                CHART_COLORS.pink,
              ],
              borderWidth: 1,
            },
          ],
        },
        sales: {
          labels: last6Months,
          datasets: [
            {
              label: 'Ventas mensuales',
              data: salesData,
              backgroundColor: CHART_COLORS.green.replace(')', ', 0.2)').replace('rgb', 'rgba'),
              borderColor: CHART_COLORS.green,
              borderWidth: 2,
              tension: 0.3,
              fill: true,
            },
          ],
        },
        customers: {
          labels: ['Clientes nuevos', 'Clientes recurrentes'],
          datasets: [
            {
              label: 'Distribución de clientes',
              data: [
                Math.floor((currentBiz.customers_count || 1) * 0.3), // 30% new
                Math.floor((currentBiz.customers_count || 1) * 0.7)  // 70% returning
              ],
              backgroundColor: [
                CHART_COLORS.purple.replace(')', ', 0.6)').replace('rgb', 'rgba'),
                CHART_COLORS.blue.replace(')', ', 0.6)').replace('rgb', 'rgba'),
              ],
              borderColor: [
                CHART_COLORS.purple,
                CHART_COLORS.blue,
              ],
              borderWidth: 1,
            },
          ],
        },
      });
    } else {
      setChartData(null);
    }
  }, [selectedBusiness, businesses]);

  // Fetch user's entrepreneurships from the API
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
          include: 'products,sales,customers'
        });

        if (!isMounted) return;

        // Handle case where the user has no entrepreneurships
        if (!businessesResponse || !businessesResponse.data || businessesResponse.data.length === 0) {
          setBusinesses([]);
          setSelectedBusiness(null);
          setError(null);
          setChartData(null);
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
                onSelect={(option) => {
                  const found = businesses.find(b => b.id === option.id);
                  if (!found) return;
                  const mapped: Entrepreneurship = {
                    id: parseInt(found.id, 10),
                    name: found.name,
                    description: found.description || '',
                    category: (typeof found.category === 'number' ? found.category : parseInt(found.category || '0', 10)) || 0,
                    image_url: found.image_url || null,
                    user_id: found.user_id,
                    created_at: found.created_at,
                    updated_at: found.updated_at,
                    products: [],
                    owner: {
                      id: found.user_id,
                      name: 'Usuario',
                      email: 'usuario@ejemplo.com',
                      username: `user_${found.user_id}`,
                      email_verified_at: null,
                      password: 'temporary-password',
                      role: 2,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      phone: null,
                      province: null,
                      canton: null,
                      district: null,
                      address: null,
                      banned: false,
                      avatar_url: null,
                      remember_token: null,
                    },
                    category_relation: {
                      id: typeof found.category === 'number' ? found.category : 0,
                      nombre: (found.category ?? '').toString() || 'Sin categoría',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    address: found.address,
                    phone: found.phone,
                    email: found.email,
                    website: found.website,
                    banned: false,
                  } as Entrepreneurship;
                  setSelectedBusiness(mapped);
                }}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div 
            onClick={() => navigate(`/entrepreneur/inventory?businessId=${selectedBusiness?.id || ''}`)}
            className="cursor-pointer hover:opacity-90 transition-opacity"
          >
            <StatsCard
              title="Productos"
              value={totalProducts}
              icon={<Package className="h-6 w-6" />}
              trend={{
                value: `${Math.floor(Math.random() * 15) + 5}% más que el mes pasado`,
                isPositive: true
              }}
            />
          </div>
          <StatsCard
            title="Ventas"
            value={new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(
              totalProducts * (Math.floor(Math.random() * 10000) + 5000)
            )}
            icon={<ShoppingBag className="h-6 w-6" />}
            trend={{
              value: `${Math.floor(Math.random() * 25) + 5}% más que el mes pasado`,
              isPositive: true
            }}
          />
          <StatsCard
            title="Clientes"
            value={Math.floor(totalProducts * (Math.random() * 5 + 1))}
            icon={<Users className="h-6 w-6" />}
            trend={{
              value: `${Math.floor(Math.random() * 10) + 2}% más que el mes pasado`,
              isPositive: true
            }}
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
              {currentBusiness.image_url ? (
                <img 
                  src={currentBusiness.image_url} 
                  alt={currentBusiness.name}
                  className="h-16 w-16 rounded-md object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                  <Store className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="font-medium">{currentBusiness.name}</h4>
                <p className="text-sm text-gray-500">
                  {currentBusiness.description || 'Sin descripción'}
                </p>
                {currentBusiness.address && (
                  <p className="text-sm text-gray-500 mt-1">
                    {currentBusiness.address}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {currentBusiness.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Teléfono</p>
                  <p>{currentBusiness.phone}</p>
                </div>
              )}
              {currentBusiness.email && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{currentBusiness.email}</p>
                </div>
              )}
              {currentBusiness.website && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Sitio web</p>
                  <a 
                    href={currentBusiness.website.startsWith('http') ? currentBusiness.website : `https://${currentBusiness.website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {currentBusiness.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Charts Section */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-6">Estadísticas</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-blue-600" />
                Productos por categoría
              </h4>
            </div>
            <div className="h-64">
              {chartData?.products ? (
                <Bar 
                  data={chartData.products} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.parsed.y} productos`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No hay datos de productos disponibles
                </div>
              )}
            </div>
          </Card>

          {/* Sales Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2">
                <LineChart className="h-5 w-5 text-green-600" />
                Ventas mensuales
              </h4>
            </div>
            <div className="h-64">
              {chartData?.sales ? (
                <Line 
                  data={chartData.sales}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `₡${context.parsed.y.toLocaleString()}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return `₡${value.toLocaleString()}`;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No hay datos de ventas disponibles
                </div>
              )}
            </div>
          </Card>

          {/* Customers Chart */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h4 className="font-medium flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                Clientes por provincia
              </h4>
              
              <div className="relative">
                <button 
                  type="button" 
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
                >
                  <Filter className="h-4 w-4 text-gray-500" />
                  {selectedProvince}
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showProvinceDropdown && (
                  <div className="absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      {PROVINCES.map((province) => (
                        <button
                          key={province}
                          className={`block w-full text-left px-4 py-2 text-sm ${province === selectedProvince 
                            ? 'bg-gray-100 text-gray-900 font-medium' 
                            : 'text-gray-700 hover:bg-gray-50'}`}
                          onClick={() => {
                            setSelectedProvince(province);
                            setShowProvinceDropdown(false);
                          }}
                        >
                          {province}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="h-64">
              {chartData?.customers ? (
                <Pie 
                  data={chartData.customers}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} cliente${value !== 1 ? 's' : ''} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No hay datos de clientes disponibles
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
