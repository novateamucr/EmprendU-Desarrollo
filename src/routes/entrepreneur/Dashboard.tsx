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
    <div className="space-y-6 pt-12 px-4 sm:px-6 3xl:px-12 4xl:px-16 text-base 3xl:text-lg 4xl:text-xl">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
          <div className="w-full max-w-2xl">
            <label className="block text-sm md:text-base 3xl:text-lg 4xl:text-2xl font-medium text-gray-700 mb-1.5">
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
        
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 3xl:gap-8 4xl:gap-10 mb-8">
          <div 
            onClick={() => navigate(`/entrepreneur/inventory?businessId=${selectedBusiness?.id || ''}`)}
            className="cursor-pointer hover:opacity-90 transition-opacity"
          >
            <StatsCard
              title="Productos"
              value={totalProducts}
              icon={<Package className="h-6 w-6 3xl:h-7 3xl:w-7 4xl:h-8 4xl:w-8" />}
              
            />
          </div>
          <StatsCard
            title="Ventas"
            value={new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(totalSales)}
            icon={<ShoppingBag className="h-6 w-6 3xl:h-7 3xl:w-7 4xl:h-8 4xl:w-8" />}
            
          />
          <div 
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              // Show customer list in a modal or navigate to customer management
              alert('Mostrar lista de clientes');
            }}
          >
            <StatsCard
              title="Clientes"
              value={uniqueCustomersCount}
              icon={<Users className="h-6 w-6 3xl:h-7 3xl:w-7 4xl:h-8 4xl:w-8" />}
              
            />
          </div>
        </div>
      </div>
      
      {/* Información del emprendimiento seleccionado */}
      <Card>
        <div className="p-6 3xl:p-8 4xl:p-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl 3xl:text-3xl 4xl:text-4xl font-medium">Información del emprendimiento</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              {currentBusiness.image_url ? (
                <img 
                  src={currentBusiness.image_url} 
                  alt={currentBusiness.name}
                  className="h-16 w-16 3xl:h-20 3xl:w-20 4xl:h-24 4xl:w-24 rounded-md object-cover"
                />
              ) : (
                <div className="h-16 w-16 3xl:h-20 3xl:w-20 4xl:h-24 4xl:w-24 rounded-md bg-gray-100 flex items-center justify-center">
                  <Store className="h-8 w-8 3xl:h-10 3xl:w-10 4xl:h-12 4xl:w-12 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="font-medium text-base md:text-lg 3xl:text-2xl 4xl:text-3xl">{currentBusiness.name}</h4>
                <p className="text-sm md:text-base 3xl:text-xl 4xl:text-2xl text-gray-500">
                  {currentBusiness.description || 'Sin descripción'}
                </p>
                {currentBusiness.address && (
                  <p className="text-sm md:text-base 3xl:text-xl 4xl:text-2xl text-gray-500 mt-1">
                    {currentBusiness.address}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {currentBusiness.phone && (
                <div>
                  <p className="text-sm md:text-base 3xl:text-xl 4xl:text-2xl font-medium text-gray-500">Teléfono</p>
                  <p className="text-sm md:text-base 3xl:text-xl 4xl:text-2xl">{currentBusiness.phone}</p>
                </div>
              )}
              {currentBusiness.email && (
                <div>
                  <p className="text-sm md:text-base 3xl:text-xl 4xl:text-2xl font-medium text-gray-500">Email</p>
                  <p className="text-sm md:text-base 3xl:text-xl 4xl:text-2xl">{currentBusiness.email}</p>
                </div>
              )}
              {currentBusiness.website && (
                <div className="col-span-2">
                  <p className="text-sm md:text-base 3xl:text-xl 4xl:text-2xl font-medium text-gray-500">Sitio web</p>
                  <a 
                    href={currentBusiness.website.startsWith('http') ? currentBusiness.website : `https://${currentBusiness.website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm md:text-base 3xl:text-xl 4xl:text-2xl"
                  >
                    {currentBusiness.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Sección de gráficos */}
      <div className="mt-8">
  <h3 className="text-lg md:text-xl 3xl:text-3xl 4xl:text-4xl font-medium mb-6">Estadísticas</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 3xl:gap-8 4xl:gap-10">
          {/* Products Chart */}
          <Card className="p-6 3xl:p-8 4xl:p-10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-base md:text-lg 3xl:text-2xl 4xl:text-3xl flex items-center gap-2">
                <BarChart2 className="h-5 w-5 3xl:h-6 3xl:w-6 4xl:h-7 4xl:w-7 text-blue-600" />
                Productos por categoría
              </h4>
            </div>
            <div className="h-56 sm:h-64 3xl:h-72 4xl:h-80">
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
          <Card className="p-6 3xl:p-8 4xl:p-10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-base md:text-lg 3xl:text-2xl 4xl:text-3xl flex items-center gap-2">
                <LineChart className="h-5 w-5 3xl:h-6 3xl:w-6 4xl:h-7 4xl:w-7 text-green-600" />
                Ventas mensuales
              </h4>
            </div>
            <div className="h-56 sm:h-64 3xl:h-72 4xl:h-80">
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
          <Card className="p-6 3xl:p-8 4xl:p-10 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h4 className="font-medium text-base md:text-lg 3xl:text-2xl 4xl:text-3xl flex items-center gap-2">
                <PieChart className="h-5 w-5 3xl:h-6 3xl:w-6 4xl:h-7 4xl:w-7 text-purple-600" />
                Clientes: nuevos vs recurrentes
              </h4>
            </div>
            <div className="h-56 sm:h-64 3xl:h-72 4xl:h-80">
              {chartData?.customers ? (
                <Pie 
                  data={chartData.customers}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        // On small screens place legend below for better fit
                        position: windowWidth < 640 ? 'bottom' as const : 'right' as const,
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

      {/* Customers Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg md:text-xl 3xl:text-3xl 4xl:text-4xl font-medium">Clientes Recientes</h3>
          <Button variant="outline" size="sm" onClick={() => alert('Ver todos los clientes')}>
            Ver todos
          </Button>
        </div>
        
        <Card>
          {/* Desktop / tablet table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm 3xl:text-base 4xl:text-lg font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm 3xl:text-base 4xl:text-lg font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm 3xl:text-base 4xl:text-lg font-medium text-gray-500 uppercase tracking-wider">
                    Provincia
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm 3xl:text-base 4xl:text-lg font-medium text-gray-500 uppercase tracking-wider">
                    Compras
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm 3xl:text-base 4xl:text-lg font-medium text-gray-500 uppercase tracking-wider">
                    Última compra
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => alert(`Mostrar detalles del cliente: ${customer.name}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 3xl:h-12 3xl:w-12 4xl:h-14 4xl:w-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium text-sm md:text-base 3xl:text-lg 4xl:text-xl">
                            {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm md:text-base 3xl:text-lg 4xl:text-xl font-medium text-gray-900">{customer.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-900">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs md:text-sm 3xl:text-lg 4xl:text-xl leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {customer.province || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-500">
                      {customer.totalPurchases} compras
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm md:text-base 3xl:text-lg 4xl:text-xl text-gray-500">
                      {new Date(customer.lastPurchase).toLocaleDateString('es-CR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list view */}
          <div className="space-y-3 md:hidden">
            {recentCustomers.map((customer) => (
              <div key={customer.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => alert(`Mostrar detalles del cliente: ${customer.name}`)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 text-right">
                    <div className="mb-1"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{customer.province || '—'}</span></div>
                    <div className="text-sm">{customer.totalPurchases} compras</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-2">Última compra: {new Date(customer.lastPurchase).toLocaleDateString('es-CR')}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
