import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyOrders } from '../services/orderService';
import { Clock, CheckCircle2, BadgeCheck, Star, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';

// Types for orders shown in MyOrders
type OrderStatus = 'solicitado' | 'aceptado' | 'cancelado' | 'completado' | 'calificado' | 'en_proceso';

type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  entrepreneurshipName: string;
  entrepreneurshipId: number;
  itemsCount: number;
  total: number;
  status: OrderStatus;
  logoUrl?: string;
  status_key: string;
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  solicitado: 'Solicitado',
  aceptado: 'Aceptado',
  en_proceso: 'En proceso',
  completado: 'Completado',
  calificado: 'Calificado',
  cancelado: 'Cancelado'
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    solicitado: 'bg-sky-50 text-sky-700 border-sky-200',
    aceptado: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    en_proceso: 'bg-purple-50 text-purple-700 border-purple-200',
    completado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    calificado: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const icons: Record<OrderStatus, JSX.Element> = {
    solicitado: <Clock size={14} className="shrink-0" />,
    aceptado: <CheckCircle2 size={14} className="shrink-0" />,
    en_proceso: <Clock size={14} className="shrink-0" />,
    completado: <BadgeCheck size={14} className="shrink-0" />,
    calificado: <Star size={14} className="shrink-0" />,
    cancelado: <XCircle size={14} className="shrink-0" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full border shadow-sm ${styles[status]}`}
      title={STATUS_LABEL[status]}
    >
      {icons[status]}
      <span className="truncate">{STATUS_LABEL[status]}</span>
    </span>
  );
}

// Map backend status -> local status keys
function mapStatus(status: string): OrderStatus {
  if (!status) return 'solicitado';
  
  const statusMap: Record<string, OrderStatus> = {
    // Frontend statuses (already mapped)
    'solicitado': 'solicitado',
    'aceptado': 'aceptado',
    'en_proceso': 'en_proceso',
    'completado': 'completado',
    'calificado': 'calificado',
    'cancelado': 'cancelado',
    // Backend statuses (add any variations here)
    'requested': 'solicitado',
    'accepted': 'aceptado',
    'in_progress': 'en_proceso',
    'completed': 'completado',
    'rated': 'calificado',
    'canceled': 'cancelado',
    // Add any other variations here
    'pending': 'solicitado',
    'processing': 'en_proceso',
    'delivered': 'completado',
    'shipped': 'en_proceso'
  };
  
  const normalizedStatus = status.toLowerCase().trim();
  return statusMap[normalizedStatus] || 'solicitado';
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch orders from the API
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setError('Usuario no autenticado');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await listMyOrders(user.id);
        
        // Map the response data to match our Order type
        const mappedOrders: Order[] = response.data.map((order: any) => ({
          id: String(order.id),
          orderNumber: order.order_number,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          entrepreneurshipName: order.entrepreneurship?.name || 'Emprendimiento',
          entrepreneurshipId: order.entrepreneurship?.id || 0,
          itemsCount: order.items?.length || 0,
          total: parseFloat(order.total) || 0,
          status: mapStatus(order.status),
          status_key: order.status,
          logoUrl: order.entrepreneurship?.logo_url
        }));
        
        setOrders(mappedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('No se pudieron cargar los pedidos. Por favor, intente de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [user]); // Removed page from dependencies since we're not paginating

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => 
      (statusFilter === 'all' || order.status === statusFilter) &&
      (query.trim() === '' || 
       (order.orderNumber && order.orderNumber.toLowerCase().includes(query.toLowerCase())) ||
       (order.entrepreneurshipName && order.entrepreneurshipName.toLowerCase().includes(query.toLowerCase())))
    );
  }, [orders, statusFilter, query]);

  if (isLoading) {
    return (
      <div className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="mt-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg bg-white">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-primary">Mis pedidos</h1>
            <p className="text-secondary mt-1">Historial de pedidos y sus estados.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-secondary whitespace-nowrap">Estado:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-sm border border-border rounded-md px-3 py-2 bg-white w-full"
              >
                <option value="all">Todos los estados</option>
                <option value="solicitado">Solicitados</option>
                <option value="aceptado">Aceptados</option>
                <option value="en_proceso">En proceso</option>
                <option value="completado">Completados</option>
                <option value="calificado">Calificados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por emprendimiento o código..."
                className="pl-10 w-full border border-border rounded-md px-3 py-2 text-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

  <div className="mt-6 bg-white rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b text-sm font-medium text-gray-500">
            <div className="col-span-3">Emprendimiento</div>
            <div className="col-span-2">Código</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-1 text-center">Artículos</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-2 text-center">Estado</div>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">No se encontraron pedidos</p>
              <p className="text-sm mt-1">
                {statusFilter === 'all' 
                  ? 'Aún no has realizado ningún pedido.' 
                  : `No hay pedidos con el estado seleccionado.`}
              </p>
            </div>
          ) : null}

          {/* Desktop / tablet: show table rows */}
          <ul className="hidden md:block divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <li
                key={order.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                onClick={() => navigate(`/orders/${order.id}`)}
                title="Ver detalle de pedido"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 flex items-center">
                    {order.logoUrl ? (
                      <img 
                        src={order.logoUrl} 
                        alt={order.entrepreneurshipName}
                        className="h-10 w-10 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                        {order.entrepreneurshipName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{order.entrepreneurshipName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-mono text-gray-600">#{order.orderNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600">
                      {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: es })}
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(order.createdAt), 'HH:mm', { locale: es })}
                    </div>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-gray-600">{order.itemsCount}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="font-medium text-gray-900">₡{order.total.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Mobile: show cards (one per order) */}
          <div className="space-y-4 block md:hidden">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                title="Ver detalle de pedido"
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer border border-gray-200"
              >
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        {order.logoUrl ? (
                          <img 
                            src={order.logoUrl} 
                            alt={order.entrepreneurshipName}
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium flex-shrink-0">
                            {order.entrepreneurshipName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{order.entrepreneurshipName}</h3>
                          <p className="text-xs text-gray-500">#{order.orderNumber}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {order.itemsCount > 0 ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-md border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">Artículos</div>
                          <div className="text-sm font-medium">{order.itemsCount}</div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-sm text-gray-600">Total</div>
                          <div className="font-semibold text-primary">₡{order.total.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Fecha</div>
                        <div className="text-sm">
                          {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: es })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Artículos</div>
                        <div className="text-sm">{order.itemsCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Total</div>
                        <div className="text-lg font-semibold text-primary">₡{order.total.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t bg-white rounded-b-lg border-border">
            <div className="text-sm text-gray-500">
              Mostrando {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
            </div>
          </div>
        </div>
      </div>
      {/* Cancel action removed from list; available in order detail view */}
    </div>
  );
}
