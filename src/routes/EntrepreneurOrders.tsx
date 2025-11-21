import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listOrdersTable, updateOrderStatus } from '../services/orderService';
import { getProfile } from '../domain/profile/service';
import { Clock, CheckCircle2, BadgeCheck, Star, XCircle, CheckCircle, Ban, ClipboardCheck, Info } from 'lucide-react';

// Types for orders shown in EntrepreneurOrders
export type OrderStatus = 'pedido_solicitado' | 'pedido_aceptado' | 'pedido_cancelado' | 'pedido_completado' | 'pedido_calificado';

export type Order = {
  id: string;
  createdAt: string; // ISO date
  entrepreneurshipName: string;
  entrepreneurshipId: number;
  items: number;
  total: number; // in CRC
  status: OrderStatus;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pedido_solicitado: 'Pedido solicitado',
  pedido_aceptado: 'Pedido aceptado',
  pedido_cancelado: 'Pedido cancelado',
  pedido_completado: 'Pedido completado',
  pedido_calificado: 'Pedido calificado',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    pedido_solicitado: 'bg-sky-50 text-sky-700 border-sky-200',
    pedido_aceptado: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pedido_cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
    pedido_completado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pedido_calificado: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const icons: Record<OrderStatus, JSX.Element> = {
    pedido_solicitado: <Clock size={14} className="shrink-0" />,
    pedido_aceptado: <CheckCircle2 size={14} className="shrink-0" />,
    pedido_cancelado: <XCircle size={14} className="shrink-0" />,
    pedido_completado: <BadgeCheck size={14} className="shrink-0" />,
    pedido_calificado: <Star size={14} className="shrink-0" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full border shadow-sm ${styles[status]} whitespace-nowrap`}
      title={STATUS_LABEL[status]}
    >
      {icons[status]}
      <span className="hidden sm:inline">{STATUS_LABEL[status]}</span>
    </span>
  );
}

// Map backend status -> local status keys
function mapStatus(s?: string): OrderStatus {
  const s2 = String(s || '').toLowerCase();
  if (s2 === 'requested' || s2 === 'draft') return 'pedido_solicitado';
  if (s2 === 'accepted') return 'pedido_aceptado';
  if (s2 === 'canceled') return 'pedido_cancelado';
  if (s2 === 'completed') return 'pedido_completado';
  if (s2 === 'rated') return 'pedido_calificado';
  return 'pedido_solicitado';
}

// Map local -> backend
function toBackendStatus(s: OrderStatus | 'accept' | 'cancel' | 'complete'): 'requested' | 'accepted' | 'canceled' | 'completed' {
  if (s === 'accept' || s === 'pedido_aceptado') return 'accepted';
  if (s === 'cancel' || s === 'pedido_cancelado') return 'canceled';
  if (s === 'complete' || s === 'pedido_completado') return 'completed';
  return 'requested';
}

export default function EntrepreneurOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('useEffect triggered in EntrepreneurOrders');
    (async () => {
      try {
        setError(null);
        setLoading(true);
        console.log('Fetching profile...');
        const profile = await getProfile();
        console.log('Profile fetched:', profile);
        
        // Get all entrepreneur's businesses
        const entrepreneurShips = Array.isArray(profile?.entrepreneurships) ? profile.entrepreneurships : [];
        console.log('Found businesses:', entrepreneurShips);
        
        if (entrepreneurShips.length === 0) {
          console.log('No businesses found for this entrepreneur');
          setOrders([]);
          setError('No se encontraron emprendimientos asociados a tu usuario.');
          return;
        }
        
        // Build status filter
        const params: any = {};
        const s = statusFilter;
        if (s !== 'all') {
          if (s === 'pedido_solicitado') params.status = ['requested','draft'];
          if (s === 'pedido_aceptado') params.status = 'accepted';
          if (s === 'pedido_cancelado') params.status = 'canceled';
          if (s === 'pedido_completado') params.status = 'completed';
          if (s === 'pedido_calificado') params.status = 'rated';
        }
        
        // Fetch orders for all businesses in parallel
        console.log('Fetching orders with params:', params);
        const allOrdersPromises = entrepreneurShips.map(async (business: any) => {
          try {
            console.log(`Fetching orders for business ${business.id} (${business.name || 'unnamed'})`);
            const res: any = await listOrdersTable(business.id, { ...params });
            console.log(`Orders for business ${business.id}:`, res?.data);
            return res?.data?.data || res?.data || [];
          } catch (err) {
            console.error(`Error fetching orders for business ${business.id}:`, err);
            return [];
          }
        });
        
        console.log('Waiting for all order requests to complete...');
        const allOrdersResults = await Promise.all(allOrdersPromises);
        const allOrders = allOrdersResults.flat();
        console.log('All orders combined:', allOrders);
        
        const addressString = [profile?.province, profile?.canton, profile?.district, profile?.address]
          .filter((p) => !!p && String(p).trim().length > 0)
          .join(', ');
          
        // Process all orders
        console.log('Processing orders...');
        const backendOrders: Order[] = allOrders.map((o: any) => {
          const entre = o.entrepreneurship || {};
          const entrepreneurshipId = Number(o.entrepreneurship_id ?? entre.id ?? 0);
          const entrepreneurshipName = String(entre.name ?? o.entrepreneurship_name ?? `Emprendimiento #${entrepreneurshipId || ''}`);
          const items = Number(o.items_total ?? (Array.isArray(o.items) ? o.items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0) : o.items_count || 0));
          const total = Number(o.grand_total ?? 0);
          const customer = {
            name: o.customer_name ?? o.customer?.name ?? '',
            phone: o.customer_phone_8 ?? o.customer?.phone ?? o.customer?.phone_8 ?? '',
            email: o.customer_email ?? o.customer?.email ?? '',
            address: addressString || (o.customer?.address ?? o.customer_address ?? o.address ?? ''),
          };
          return {
            id: String(o.id),
            createdAt: String(o.created_at ?? new Date().toISOString()),
            entrepreneurshipName,
            entrepreneurshipId,
            items,
            total,
            status: mapStatus(o.status),
            customer,
          } as Order;
        });
        
        // Sort by creation date, newest first
        backendOrders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setOrders(backendOrders);
      } catch (err: any) {
        console.error('Error cargando pedidos:', err?.response?.data || err);
        const msg = err?.response?.data?.message || err?.message || 'Error al cargar pedidos';
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    return orders
      .filter((o) => (statusFilter === 'all' ? true : o.status === statusFilter))
      .filter((o) =>
        query.trim() ? (
          o.id.toLowerCase().includes(query.toLowerCase()) ||
          o.entrepreneurshipName.toLowerCase().includes(query.toLowerCase()) ||
          (o.customer?.name || '').toLowerCase().includes(query.toLowerCase())
        ) : true
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, query]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function handleAction(o: Order, action: 'accept' | 'cancel' | 'complete') {
    try {
      setLoadingId(o.id);
      const backendStatus = toBackendStatus(action);
      await updateOrderStatus(o.id, backendStatus);
      setOrders(prev => prev.map(p => p.id === o.id ? { ...p, status: mapStatus(backendStatus) } : p));
    } catch {
      // no-op; could add toast
    } finally {
      setLoadingId(null);
    }
  }

  function ActionButtons({ o }: { o: Order }) {
    const isRequested = o.status === 'pedido_solicitado';
    const isAccepted = o.status === 'pedido_aceptado';
    const isTerminal = o.status === 'pedido_cancelado' || o.status === 'pedido_completado' || o.status === 'pedido_calificado';

    // Button classes
    const baseButtonClass = "flex-1 flex items-center justify-center px-2 py-1.5 rounded-md border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-offset-1 transition-colors";
    const acceptButtonClass = `${baseButtonClass} border-green-200 bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-500`;
    const cancelButtonClass = `${baseButtonClass} border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500`;
    const completeButtonClass = `${baseButtonClass} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500`;
    const disabledClass = "opacity-50 cursor-not-allowed";

    return (
      <div className="w-full flex items-stretch gap-1.5">
        {isRequested && !isTerminal ? (
          <>
            <button
              className={`${acceptButtonClass} ${loadingId === o.id ? disabledClass : ''}`}
              title="Aceptar pedido"
              aria-label="Aceptar pedido"
              onClick={(e) => { e.stopPropagation(); handleAction(o, 'accept'); }}
              disabled={loadingId === o.id}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              <span>Aceptar</span>
            </button>
            <button
              className={`${cancelButtonClass} ${loadingId === o.id ? disabledClass : ''}`}
              title="Rechazar pedido"
              aria-label="Rechazar pedido"
              onClick={(e) => { e.stopPropagation(); handleAction(o, 'cancel'); }}
              disabled={loadingId === o.id}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              <span>Rechazar</span>
            </button>
          </>
        ) : isAccepted && !isTerminal ? (
          <>
            <button
              className={`${completeButtonClass} ${loadingId === o.id ? disabledClass : ''}`}
              title="Marcar como completado"
              aria-label="Marcar como completado"
              onClick={(e) => { e.stopPropagation(); handleAction(o, 'complete'); }}
              disabled={loadingId === o.id}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>Completar</span>
            </button>
            <button
              className={`${cancelButtonClass} ${loadingId === o.id ? disabledClass : ''}`}
              title="Cancelar pedido"
              aria-label="Cancelar pedido"
              onClick={(e) => { e.stopPropagation(); handleAction(o, 'cancel'); }}
              disabled={loadingId === o.id}
            >
              <Ban className="w-3.5 h-3.5 mr-1" />
              <span>Cancelar</span>
            </button>
          </>
        ) : (
          <div className="text-xs text-gray-500 italic w-full text-center py-1">
            {o.status === 'pedido_completado' ? 'Completado' : 
             o.status === 'pedido_cancelado' ? 'Cancelado' : 'Sin acciones'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-6 md:pt-12 pb-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="px-3 sm:px-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-primary">Pedidos</h1>
          <p className="text-secondary mt-1 text-sm sm:text-base">Pedidos de todos tus emprendimientos.</p>
        </div>

        <div className="mt-6 px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full sm:w-48 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pedido_solicitado">Pedido solicitado</option>
                <option value="pedido_aceptado">Pedido aceptado</option>
                <option value="pedido_completado">Pedido completado</option>
                <option value="pedido_calificado">Pedido calificado</option>
                <option value="pedido_cancelado">Pedido cancelado</option>
              </select>
            </div>
            <div className="w-full sm:w-64">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  placeholder="Cliente, emprendimiento o código..."
                  className="w-full border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <span className="absolute right-2.5 top-2.5 text-gray-400" title="Buscar por cliente, código o emprendimiento">
                  <Info className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mx-3 sm:mx-4">
          <div className="overflow-x-auto -mx-1">
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 border-b text-xs text-gray-500 font-medium bg-gray-50">
              <div className="col-span-2 text-center">Emprendimiento</div>
              <div className="col-span-1 text-center">Código</div>
              <div className="col-span-1 text-center">Fecha</div>
              <div className="col-span-2 text-center">Total</div>
              <div className="col-span-2 text-center">Cliente</div>
              <div className="col-span-2 text-center">Estado</div>
              <div className="col-span-2 text-center">Acciones</div>
            </div>
          </div>
          {loading && (
            <ul className="divide-y">
              {[1,2,3,4].map((i) => (
                <li key={i} className="px-4 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-12 md:col-span-3">
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-100 rounded mt-2 animate-pulse md:hidden" />
                    </div>
                    <div className="hidden md:block col-span-1">
                      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-28 bg-gray-100 rounded mt-2 animate-pulse" />
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <div className="h-8 w-32 bg-gray-100 rounded-md animate-pulse" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && filtered.length === 0 && (
            <div className="p-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <ClipboardCheck className="w-6 h-6 text-secondary" />
              </div>
              <p className="text-secondary text-sm">No hay pedidos para mostrar</p>
              {error && (
                <p className="text-rose-600 text-xs mt-2">{error}</p>
              )}
            </div>
          )}
          {!loading && (
          <ul className="divide-y divide-gray-200">
            {paged.map((o) => (
              <li
                key={o.id}
                className="px-3 sm:px-4 py-3 sm:py-4 cursor-pointer transition-colors hover:bg-gray-50/80 border-b border-gray-100 last:border-0"
                onClick={() => navigate(`/entrepreneur/orders/${o.id}`)}
                title="Ver detalle de pedido"
              >
                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{o.entrepreneurshipName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Código: {o.id}</div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Fecha</div>
                      <div>{new Date(o.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="font-semibold">₡{o.total.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-center">
                    <div className="text-xs text-gray-500">Cliente</div>
                    <div className="font-medium">{o.customer?.name || '-'}</div>
                    <div className="text-gray-600 text-xs">{o.customer?.phone || '-'}</div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="w-full" onClick={(e) => e.stopPropagation()}>
                      <div className={loadingId === o.id ? 'opacity-50 pointer-events-none' : ''}>
                        <ActionButtons o={o} />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop View */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 items-center text-sm">
                  <div className="col-span-2 text-center">
                    <div className="font-medium text-gray-900">{o.entrepreneurshipName}</div>
                  </div>
                  <div className="col-span-1 text-gray-500 text-sm text-center">{o.id}</div>
                  <div className="col-span-1 text-gray-500 text-center">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                  <div className="col-span-2 text-center font-medium text-gray-900">
                    ₡{o.total.toLocaleString()}
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="font-medium">{o.customer?.name || '-'}</div>
                    <div className="text-xs text-gray-500 truncate">{o.customer?.phone || '-'}</div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                    <div className={loadingId === o.id ? 'opacity-50 pointer-events-none' : ''}>
                      <ActionButtons o={o} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          )}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="whitespace-nowrap">Filas por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="whitespace-nowrap">
                  {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} de {filtered.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700 w-24 text-center">
                  Página {page} de {totalPages}
                </span>
                <button
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}