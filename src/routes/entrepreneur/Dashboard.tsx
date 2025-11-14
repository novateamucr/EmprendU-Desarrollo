import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { entrepreneurshipApi, productApi } from '../../services/entrepreneurshipService';
import { listOrdersByEntrepreneurship } from '../../services/orderService';
import { Package, ShoppingBag, Users,AlertTriangle,Store,Plus,Eye,BarChart2,PieChart,LineChart } from 'lucide-react';
import { ModalAnimaciones } from '../../components/ui/ModalAnimaciones';
import agregarEmprendimientoGif from '../../assets/animaciones/agregarEmprendimiento.gif';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BusinessSelect } from '../../components/ui/BusinessSelect';
import { Skeleton, SkeletonDashboardStats } from '../../components/ui/Skeleton';
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
  <Card className="p-6 3xl:p-8 4xl:p-10">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm md:text-base 3xl:text-lg 4xl:text-xl font-medium text-gray-500">{title}</p>
        <p className="mt-1 text-2xl md:text-3xl 3xl:text-4xl 4xl:text-5xl font-semibold text-gray-900">{value}</p>
        {trend && (
          <p className={`mt-1 text-sm md:text-base 3xl:text-lg 4xl:text-xl ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value} respecto al mes pasado
          </p>
        )}
      </div>
      <div className="rounded-lg bg-primary/10 p-3 3xl:p-4 4xl:p-5 text-primary">
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

// Componente principal del panel de "Mis emprendimientos":
// - Carga los emprendimientos del usuario y permite seleccionar uno.
// - Muestra estadísticas (productos, ventas, clientes) y gráficos.
// - Enlaza a inventario y otras secciones de gestión.
export default function Dashboard() {
  const { selectedBusiness, setSelectedBusiness } = useBusiness();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [uniqueCustomersCount, setUniqueCustomersCount] = useState(0);
  const [recentCustomers, setRecentCustomers] = useState<Array<{ id: string; name: string; email: string; province?: string | null; totalPurchases: number; lastPurchase: string }>>([]);
  
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Helper to safely extract total from an order record
  const getOrderTotal = (order: any) => {
    if (!order) return 0;
    const toNum = (v: any) => (typeof v === 'number' ? v : (typeof v === 'string' ? parseFloat(v) : 0)) || 0;
    // Prefer grand_total if present
    const grand = toNum(order.grand_total ?? order.grandTotal);
    if (grand) return grand;
    const items = toNum(order.items_total ?? order.itemsTotal);
    const opts = toNum(order.options_total ?? order.optionsTotal);
    const shipping = toNum(order.shipping_total ?? order.shippingTotal);
    const discount = toNum(order.discount_total ?? order.discountTotal);
    return items + opts + shipping - discount;
  };

  // Fetch real data and prepare chart datasets when selected business changes
  useEffect(() => {
    const loadCharts = async () => {
      if (!selectedBusiness?.id) {
        setChartData(null);
        setTotalProducts(0);
        setTotalSales(0);
        setUniqueCustomersCount(0);
        setRecentCustomers([]);
        return;
      }

      try {
        setIsLoading(true);
        const entrepreneurshipId = String(selectedBusiness.id);

        // Fetch products and orders in parallel
        const [productsResp, ordersResp] = await Promise.all([
          // Fetch all products (first page large page size to reduce requests)
          productApi.getByEntrepreneurship(entrepreneurshipId, { page: 1, per_page: 200 }),
          // Fetch orders for the entrepreneurship
          listOrdersByEntrepreneurship(entrepreneurshipId, 1),
        ]);

        // Handle products
        const productsData: any[] = Array.isArray((productsResp as any)?.data)
          ? (productsResp as any).data
          : Array.isArray(productsResp)
            ? (productsResp as any)
            : [];
        setTotalProducts(productsData.length);

        // Count products by category name (fallback to 'Sin categoría')
        const categoryCounts = productsData.reduce((acc: Record<string, number>, p: any) => {
          const categoryName = (p.category && typeof p.category === 'string')
            ? p.category
            : (p.category_relation?.nombre || 'Sin categoría');
          acc[categoryName || 'Sin categoría'] = (acc[categoryName || 'Sin categoría'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Handle orders response which could be array or paginated object
        let ordersList: any[] = [];
        if (Array.isArray((ordersResp as any)?.data)) {
          // Could be { data: [...] } or Laravel paginator shape
          const d = (ordersResp as any).data;
          ordersList = Array.isArray(d) ? d : [];
        } else if (Array.isArray(ordersResp)) {
          ordersList = ordersResp as any[];
        } else {
          // Try nested
          ordersList = Array.isArray((ordersResp as any)?.data?.data) ? (ordersResp as any).data.data : [];
        }

        // Compute monthly sales for last 6 months
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const now = new Date();
        // Prepare a map for last 6 months
        const last6: { key: string; label: string; year: number; month: number }[] = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          const label = months[d.getMonth()];
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
          return { key, label, year: d.getFullYear(), month: d.getMonth() };
        });
        const salesByMonth: Record<string, number> = Object.fromEntries(last6.map(({ key }) => [key, 0]));

        let totalSalesAccum = 0;
  const customerMap: Record<string, { name: string; email: string; phone?: string | null; count: number; lastPurchase: string; province?: string | null }> = {};

        ordersList.forEach((order: any) => {
          const createdAt = new Date(order.created_at || order.createdAt || order.date || Date.now());
          const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
          const amount = getOrderTotal(order);
          totalSalesAccum += amount;
          if (salesByMonth[monthKey] !== undefined) {
            salesByMonth[monthKey] += amount;
          }

          // Track customers by email
          const email: string = order.customer_email || order.customerEmail || '';
          const phone: string | null = order.customer_phone || order.customerPhone || null;
          const name: string = order.customer_name || order.customerName || 'Cliente';
          const customerKey = email || phone || name; // fallback in case email is missing
          if (customerKey) {
            const prev = customerMap[customerKey];
            if (!prev) {
              customerMap[customerKey] = { name, email, phone, count: 1, lastPurchase: createdAt.toISOString(), province: order.customer_province || null };
            } else {
              prev.count += 1;
              if (new Date(prev.lastPurchase) < createdAt) prev.lastPurchase = createdAt.toISOString();
            }
          }
        });

        setTotalSales(totalSalesAccum);

        // Prepare chart datasets
        const productsChart = {
          labels: Object.keys(categoryCounts),
          datasets: [
            {
              label: 'Productos por categoría',
              data: Object.values(categoryCounts),
              backgroundColor: [
                CHART_COLORS.blue,
                CHART_COLORS.green,
                CHART_COLORS.yellow,
                CHART_COLORS.purple,
                CHART_COLORS.pink,
                CHART_COLORS.indigo,
                CHART_COLORS.teal,
                CHART_COLORS.red,
              ],
              borderColor: [
                CHART_COLORS.blue,
                CHART_COLORS.green,
                CHART_COLORS.yellow,
                CHART_COLORS.purple,
                CHART_COLORS.pink,
                CHART_COLORS.indigo,
                CHART_COLORS.teal,
                CHART_COLORS.red,
              ],
              borderWidth: 1,
            },
          ],
        };

        const salesChart = {
          labels: last6.map(m => m.label),
          datasets: [
            {
              label: 'Ventas mensuales',
              data: last6.map(({ key }) => Math.round((salesByMonth[key] || 0) / 1000) * 1000),
              backgroundColor: CHART_COLORS.green.replace(')', ', 0.2)').replace('rgb', 'rgba'),
              borderColor: CHART_COLORS.green,
              borderWidth: 2,
              tension: 0.3,
              fill: true,
            },
          ],
        };

        // Customers: new vs returning
        const customersArr = Object.values(customerMap);
        const newCustomers = customersArr.filter(c => c.count === 1).length;
        const returningCustomers = customersArr.filter(c => c.count > 1).length;
        setUniqueCustomersCount(customersArr.length);

        const customersChart = {
          labels: ['Clientes nuevos', 'Clientes recurrentes'],
          datasets: [
            {
              label: 'Distribución de clientes',
              data: [newCustomers, returningCustomers],
              backgroundColor: [
                CHART_COLORS.purple.replace(')', ', 0.6)').replace('rgb', 'rgba'),
                CHART_COLORS.blue.replace(')', ', 0.6)').replace('rgb', 'rgba'),
              ],
              borderColor: [CHART_COLORS.purple, CHART_COLORS.blue],
              borderWidth: 1,
            },
          ],
        };

        setChartData({ products: productsChart, sales: salesChart, customers: customersChart });

        // Recent customers list (top 5 by lastPurchase)
        const recent = customersArr
          .sort((a, b) => new Date(b.lastPurchase).getTime() - new Date(a.lastPurchase).getTime())
          .slice(0, 5)
          .map((c, idx) => ({ id: c.email || String(idx), name: c.name, email: c.email, province: c.province ?? null, totalPurchases: c.count, lastPurchase: c.lastPurchase }));
        setRecentCustomers(recent);

      } catch (err) {
        console.error('Error loading dashboard charts:', err);
        toast.error('No se pudieron cargar las estadísticas del dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadCharts();
  }, [selectedBusiness]);

  // Observa el ancho de la ventana para ajustar opciones de gráficos de forma responsiva
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Obtiene los emprendimientos del usuario desde la API
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
  <div className="space-y-6 pt-12 px-4 sm:px-6 3xl:px-12 4xl:px-16 text-base 3xl:text-lg 4xl:text-xl">
        <div className="mb-6">
          <Skeleton variant="text" width="200px" height={32} className="mb-4" />
          <Skeleton variant="rectangular" width={600} height={56} className="rounded-lg mb-6" />
        </div>
        
        <SkeletonDashboardStats />

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <Skeleton variant="text" width="180px" height={24} className="mb-4" />
            <div className="flex items-center justify-center">
              <Skeleton variant="rectangular" width="100%" height={100} className="rounded-lg" />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <Skeleton variant="text" width="180px" height={24} className="mb-4" />
            <div className="h-64 flex items-center justify-center">
              <Skeleton variant="rectangular" width="100%" height={240} className="rounded-lg" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <Skeleton variant="text" width="180px" height={24} className="mb-4" />
            <div className="h-64 flex items-center justify-center">
              <Skeleton variant="rectangular" width="100%" height={240} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <Skeleton variant="text" width="200px" height={28} />
            <Skeleton variant="rectangular" width={120} height={40} className="rounded-md" />
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <Skeleton variant="circular" width={40} height={40} />
                  <div>
                    <Skeleton variant="text" width={120} height={20} className="mb-1" />
                    <Skeleton variant="text" width={80} height={16} />
                  </div>
                </div>
                <Skeleton variant="text" width={60} height={20} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
  <div className="flex flex-col items-center justify-center h-64 space-y-4 text-base 3xl:text-lg 4xl:text-xl">
        <AlertTriangle className="h-12 w-12 3xl:h-14 3xl:w-14 4xl:h-16 4xl:w-16 text-yellow-500" />
        <p className="text-lg 3xl:text-xl 4xl:text-2xl font-medium text-gray-700">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  // Convierte el objeto seleccionado a la forma usada por el UI (BusinessOption)
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

  // Estado de carga alternativo (skeletons de interface)
  if (isLoading) {
    return (
      <div className="space-y-6 pt-12 px-4 sm:px-6">
        <div className="mb-6">
          <Skeleton variant="text" width="200px" height={32} className="mb-4" />
          <Skeleton variant="rectangular" width="100%" height={56} className="rounded-lg mb-6" />
        </div>
        
        <SkeletonDashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <Skeleton variant="text" width="180px" height={24} className="mb-4" />
            <div className="h-64 flex items-center justify-center">
              <Skeleton variant="rectangular" width="100%" height={240} className="rounded-lg" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <Skeleton variant="text" width="180px" height={24} className="mb-4" />
            <div className="h-64 flex items-center justify-center">
              <Skeleton variant="circular" width={200} height={200} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <Skeleton variant="text" width="200px" height={28} />
            <Skeleton variant="rectangular" width={120} height={40} className="rounded-md" />
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <Skeleton variant="circular" width={40} height={40} />
                  <div>
                    <Skeleton variant="text" width={120} height={20} className="mb-1" />
                    <Skeleton variant="text" width={80} height={16} />
                  </div>
                </div>
                <Skeleton variant="text" width={60} height={20} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Si no hay emprendimientos o no hay uno seleccionado, se muestra un vacío con CTA
  if (!currentBusiness || businesses.length === 0) {
    return (
  <div className="container mx-auto px-4 3xl:px-12 4xl:px-16 py-8 text-base 3xl:text-lg 4xl:text-xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 3xl:p-14 4xl:p-16 text-center max-w-3xl 3xl:max-w-4xl 4xl:max-w-5xl mx-auto">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 mb-6">
            <Package className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl 3xl:text-3xl 4xl:text-4xl font-bold text-gray-900 mb-3">Aún no tienes emprendimientos</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg 3xl:text-xl 4xl:text-2xl">
            Crea tu primer emprendimiento para comenzar a vender productos y llegar a más clientes en nuestra plataforma.
          </p>
          
           <button
              onClick={() => setShowExtraModal(true)}
              className="transition-colors pb-4text-sm text-decoration-line: underline text-gray-500 mb-4 hover:text-blue-600"
              aria-label="Abrir información"
            >
              Como crear un emprendimiento
            </button>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/entrepreneur/business/setup" className="flex items-center gap-2">
                <Plus className="h-5 w-5 3xl:h-6 3xl:w-6 4xl:h-7 4xl:w-7" />
                Crear mi primer emprendimiento
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/home" className="flex items-center gap-2">
                <Eye className="h-5 w-5 3xl:h-6 3xl:w-6 4xl:h-7 4xl:w-7" />
                Ver ejemplos
              </Link>
            </Button>
          </div>
        </div>
        <ModalAnimaciones
          isOpen={showExtraModal}
          onClose={() => setShowExtraModal(false)}
          title="¿Cómo agrego un emprendimiento?"
          pointerGifSrc={agregarEmprendimientoGif}
          >
          <div className="space-y-4 text-gray-700 text-sm">
            <div>
               <p className="font-semibold">Ingresa a Mis Emprendimientos</p>
               <p>Dirígete a la pestaña de Mis emprendimientos en la barra de navegación</p>
            </div>
            
            <div>
                <p className="font-semibold">Ingresa al Dashboard</p>
                <p>Dirígete al Dashboard en la barra de navegación lateral</p>
            </div>
            
            <div>
                <p className="font-semibold">Haz click en Crear mi primer emprendimiento</p>
                <p>Presiona el botón de Crear Mi primer emprendimiento</p>
            </div>
            
            <div>
                <p className="font-semibold">Agregar los datos de tu emprendimiento</p>
                <p>Completa los datos solicitados, con el nombre de tu emprendimiento, la categoría de los productos que vendes, y una descripción del emprendimiento</p>
            </div>
          </div>
        </ModalAnimaciones>
      </div>      
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 3xl:p-8 4xl:p-10">
      <div className="max-w-[2000px] mx-auto space-y-6">
        {/* Business Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="w-full max-w-3xl">
              <label className="block text-sm sm:text-base md:text-lg 3xl:text-xl 4xl:text-2xl font-medium text-gray-700 mb-2">
                Seleccionar emprendimiento
              </label>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="flex-1">
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
                    className="w-full"
                  />
                </div>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full sm:w-auto"
                >
                  <Link to="/entrepreneur/business/setup" className="flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Nuevo</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div 
            onClick={() => navigate(`/entrepreneur/inventory?businessId=${selectedBusiness?.id || ''}`)}
            className="cursor-pointer hover:opacity-90 transition-opacity"
          >
            <StatsCard
              title="Productos"
              value={totalProducts}
              icon={<Package className="h-6 w-6 3xl:h-8 3xl:w-8 4xl:h-10 4xl:w-10" />}
            />
          </div>
          <div 
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => navigate('/entrepreneur/orders')}
          >
            <StatsCard
              title="Ventas"
              value={new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(totalSales)}
              icon={<ShoppingBag className="h-6 w-6 3xl:h-8 3xl:w-8 4xl:h-10 4xl:w-10" />}
            />
          </div>
          <div 
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => navigate('/entrepreneur/customers')}
          >
            <StatsCard
              title="Clientes"
              value={uniqueCustomersCount}
              icon={<Users className="h-6 w-6 3xl:h-8 3xl:w-8 4xl:h-10 4xl:w-10" />}
            />
          </div>
        </div>
        
        {/* Business Information */}
        <Card className="overflow-hidden">
          <div className="p-6 3xl:p-8 4xl:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl 3xl:text-3xl 4xl:text-4xl font-medium text-gray-900">
                Información del emprendimiento
              </h3>
              <Button 
                asChild 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto mt-4 sm:mt-0"
              >
                <Link to={`/entrepreneur/business/edit/${selectedBusiness?.id}`} className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <span>Editar</span>
                </Link>
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0">
                  {currentBusiness.image_url ? (
                    <img 
                      src={currentBusiness.image_url} 
                      alt={currentBusiness.name}
                      className="h-24 w-24 sm:h-32 sm:w-32 3xl:h-40 3xl:w-40 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="h-24 w-24 sm:h-32 sm:w-32 3xl:h-40 3xl:w-40 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Store className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xl sm:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold text-gray-900 mb-2">
                    {currentBusiness.name}
                  </h4>
                  <p className="text-gray-600 text-sm sm:text-base 3xl:text-lg 4xl:text-xl">
                    {currentBusiness.description || 'Sin descripción'}
                  </p>
                  {currentBusiness.address && (
                    <div className="mt-3 flex items-start">
                      <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm sm:text-base 3xl:text-lg 4xl:text-xl text-gray-600">
                        {currentBusiness.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                {currentBusiness.phone && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Teléfono</p>
                    <a 
                      href={`tel:${currentBusiness.phone.replace(/\D/g, '')}`}
                      className="text-base 3xl:text-lg 4xl:text-xl font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {currentBusiness.phone}
                    </a>
                  </div>
                )}
                {currentBusiness.email && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                    <a 
                      href={`mailto:${currentBusiness.email}`}
                      className="text-base 3xl:text-lg 4xl:text-xl font-medium text-gray-900 hover:text-blue-600 transition-colors break-all"
                    >
                      {currentBusiness.email}
                    </a>
                  </div>
                )}
                {currentBusiness.website && (
                  <div className="bg-gray-50 p-4 rounded-lg sm:col-span-2 lg:col-span-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">Sitio web</p>
                    <a 
                      href={currentBusiness.website.startsWith('http') ? currentBusiness.website : `https://${currentBusiness.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-base 3xl:text-lg 4xl:text-xl font-medium text-blue-600 hover:text-blue-700 transition-colors break-all"
                    >
                      {currentBusiness.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Charts Section */}
        <div className="mb-8">
          <h3 className="text-xl sm:text-2xl 3xl:text-3xl 4xl:text-4xl font-medium text-gray-900 mb-6">
            Estadísticas
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 3xl:gap-8 4xl:gap-10">
            {/* Products Chart */}
            <Card className="p-6 3xl:p-8 4xl:p-10">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg sm:text-xl 3xl:text-2xl 4xl:text-3xl font-medium flex items-center gap-2">
                  <BarChart2 className="h-6 w-6 3xl:h-8 3xl:w-8 4xl:h-10 4xl:w-10 text-blue-600" />
                  Productos por categoría
                </h4>
              </div>
              <div className="h-64 sm:h-72 3xl:h-80 4xl:h-96">
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
                  <div className="h-full flex items-center justify-center text-gray-500 text-lg">
                    No hay datos de productos disponibles
                  </div>
                )}
              </div>
            </Card>

            {/* Sales Chart */}
            <Card className="p-6 3xl:p-8 4xl:p-10">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg sm:text-xl 3xl:text-2xl 4xl:text-3xl font-medium flex items-center gap-2">
                  <LineChart className="h-6 w-6 3xl:h-8 3xl:w-8 4xl:h-10 4xl:w-10 text-green-600" />
                  Ventas mensuales
                </h4>
              </div>
              <div className="h-64 sm:h-72 3xl:h-80 4xl:h-96">
                {chartData?.sales ? (
                  <Line 
                    data={chartData.sales}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return `₡${value}`;
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-lg">
                    No hay datos de ventas disponibles
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h3 className="text-xl sm:text-2xl 3xl:text-3xl 4xl:text-4xl font-medium text-gray-900 mb-4 sm:mb-0">
              Clientes Recientes
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/entrepreneur/customers')}
              className="w-full sm:w-auto"
            >
              Ver todos
            </Button>
          </div>
          
          <Card>
            {/* Desktop/Tablet View */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última compra
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total gastado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compras
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentCustomers.length > 0 ? (
                    recentCustomers.map((customer) => (
                      <tr 
                        key={customer.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/entrepreneur/customers/${customer.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(customer.lastPurchase).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₡{/* Format total spent */}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.totalPurchases}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                        No hay clientes recientes para mostrar
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Mobile View */}
            <div className="md:hidden">
              {recentCustomers.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {recentCustomers.map((customer) => (
                    <div 
                      key={customer.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/entrepreneur/customers/${customer.id}`)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 text-lg font-medium">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.totalPurchases} compras
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            Última compra: {new Date(customer.lastPurchase).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-gray-500">
                  No hay clientes recientes para mostrar
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
