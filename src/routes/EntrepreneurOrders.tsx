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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full border shadow-sm ${styles[status]}`}
      title={STATUS_LABEL[status]}
    >
      {icons[status]}
      <span>{STATUS_LABEL[status]}</span>
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
    (async () => {
      try {
        setError(null);
        const profile = await getProfile();
        const firstEntre = Array.isArray(profile?.entrepreneurships) && profile.entrepreneurships.length > 0 ? profile.entrepreneurships[0] : null;
        const entrepreneurshipId = Number(firstEntre?.id || 0);
        if (!entrepreneurshipId) {
          setOrders([]);
          setError('No se encontró un emprendimiento asociado a tu usuario.');
          return;
        }
        const params: any = {};
        const s = statusFilter;
        if (s !== 'all') {
          if (s === 'pedido_solicitado') params.status = ['requested','draft'];
          if (s === 'pedido_aceptado') params.status = 'accepted';
          if (s === 'pedido_cancelado') params.status = 'canceled';
          if (s === 'pedido_completado') params.status = 'completed';
          if (s === 'pedido_calificado') params.status = 'rated';
        }
        const res: any = await listOrdersTable(entrepreneurshipId, params);
        const arr = (res?.data && Array.isArray(res.data)) ? res.data : (Array.isArray(res) ? res : (res?.data?.data || res?.data || []));
        const addressString = [profile?.province, profile?.canton, profile?.district, profile?.address]
          .filter((p) => !!p && String(p).trim().length > 0)
          .join(', ');
        const backendOrders: Order[] = (arr || []).map((o: any) => {
          const entre = o.entrepreneurship || {};
          const entrepreneurshipId2 = Number(o.entrepreneurship_id ?? entre.id ?? entrepreneurshipId);
          const entrepreneurshipName = String(entre.name ?? o.entrepreneurship_name ?? `Emprendimiento #${entrepreneurshipId2 || ''}`);
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
            entrepreneurshipId: entrepreneurshipId2,
            items,
            total,
            status: mapStatus(o.status),
            customer,
          } as Order;
        });
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

    return (
      <div className="flex items-center justify-center gap-2">
        {isRequested && !isTerminal && (
          <button
            className="p-2 rounded-md border border-border hover:bg-emerald-50 text-emerald-600"
            title="Aceptar"
            aria-label="Aceptar pedido"
            onClick={(e) => { e.stopPropagation(); handleAction(o, 'accept'); }}
            disabled={loadingId === o.id}
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
        {isRequested && !isTerminal && (
          <button
            className="p-2 rounded-md border border-border hover:bg-rose-50 text-rose-600"
            title="Cancelar"
            aria-label="Cancelar pedido"
            onClick={(e) => { e.stopPropagation(); handleAction(o, 'cancel'); }}
            disabled={loadingId === o.id}
          >
            <Ban className="w-4 h-4" />
          </button>
        )}
        {isAccepted && !isTerminal && (
          <button
            className="p-2 rounded-md border border-border hover:bg-indigo-50 text-indigo-600"
            title="Completar"
            aria-label="Completar pedido"
            onClick={(e) => { e.stopPropagation(); handleAction(o, 'complete'); }}
            disabled={loadingId === o.id}
          >
            <ClipboardCheck className="w-4 h-4" />
          </button>
        )}
        {isAccepted && !isTerminal && (
          <button
            className="p-2 rounded-md border border-border hover:bg-rose-50 text-rose-600"
            title="Cancelar"
            aria-label="Cancelar pedido"
            onClick={(e) => { e.stopPropagation(); handleAction(o, 'cancel'); }}
            disabled={loadingId === o.id}
          >
            <Ban className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-primary">Pedidos</h1>
        <p className="text-secondary mt-1">Pedidos de todos tus emprendimientos.</p>

        <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex gap-2 items-center">
            <label className="text-sm text-secondary">Estado:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-sm border border-border rounded-md px-2 py-1 bg-white"
            >
              <option value="all">Todos</option>
              <option value="pedido_solicitado">Pedido solicitado</option>
              <option value="pedido_aceptado">Pedido aceptado</option>
              <option value="pedido_completado">Pedido completado</option>
              <option value="pedido_calificado">Pedido calificado</option>
              <option value="pedido_cancelado">Pedido cancelado</option>
            </select>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por cliente, emprendimiento o código..."
              className="w-full md:w-80 border border-border rounded-md px-3 py-2 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span title="Usa el buscador para filtrar por cliente, código o emprendimiento">
              <Info className="w-4 h-4 text-secondary" />
            </span>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="hidden md:grid md:grid-cols-9 gap-4 px-4 py-3 border-b text-xs text-secondary text-center">
              <div className="col-span-1 whitespace-nowrap">Emprendimiento</div>
              <div className="col-span-1 whitespace-nowrap">Código</div>
              <div className="col-span-1 whitespace-nowrap">Fecha</div>
              <div className="col-span-1 whitespace-nowrap">Artículos</div>
              <div className="col-span-1 whitespace-nowrap">Total</div>
              <div className="col-span-1 whitespace-nowrap">Cliente</div>
              <div className="col-span-1 whitespace-nowrap">Dirección</div>
              <div className="col-span-1 whitespace-nowrap">Estado</div>
              <div className="col-span-1 whitespace-nowrap">Acción</div>
            </div>
          </div>
          {loading && (
            <ul className="divide-y">
              {[1,2,3,4].map((i) => (
                <li key={i} className="px-4 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-12 md:col-span-2">
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-100 rounded mt-2 animate-pulse md:hidden" />
                    </div>
                    <div className="hidden md:block col-span-2">
                      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                      <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                      <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-28 bg-gray-100 rounded mt-2 animate-pulse" />
                    </div>
                    <div className="col-span-12 md:col-span-1">
                      <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <div className="h-8 w-24 bg-gray-100 rounded-md animate-pulse" />
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
          <ul className="divide-y">
            {paged.map((o) => (
              <li
                key={o.id}
                className="px-4 py-4 cursor-pointer transition-colors hover:bg-gray-50/80"
                onClick={() => navigate(`/entrepreneur/orders/${o.id}`)}
                title="Ver detalle de pedido"
              >
                <div className="grid grid-cols-12 md:grid-cols-9 gap-4 items-center text-center md:text-center">
                  <div className="col-span-12 md:col-span-1 text-left md:text-center">
                    <div className="font-medium text-primary">{o.entrepreneurshipName}</div>
                    <div className="md:hidden text-xs text-secondary mt-0.5">Código: {o.id}</div>
                  </div>
                  <div className="hidden md:block col-span-1 text-sm">{o.id}</div>
                  <div className="col-span-6 md:col-span-1 text-sm text-secondary">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                  <div className="col-span-3 md:col-span-1 text-sm">{o.items}</div>
                  <div className="col-span-3 md:col-span-1 text-sm font-semibold text-primary">
                    ₡{o.total.toLocaleString()}
                  </div>
                  <div className="col-span-12 md:col-span-1 text-xs md:text-sm text-left">
                    <div className="font-medium">{o.customer?.name || '-'}</div>
                    <div className="text-secondary">{o.customer?.phone || '-'}</div>
                    <div className="text-secondary truncate">{o.customer?.email || '-'}</div>
                  </div>
                  <div className="col-span-12 md:col-span-1 text-xs md:text-sm text-secondary truncate text-left md:text-center" title={o.customer?.address || ''}>
                    <span className="md:hidden font-medium text-primary">Dirección: </span>
                    {o.customer?.address || '-'}
                  </div>
                  <div className="col-span-6 md:col-span-1 flex items-center justify-center gap-2 mt-2 md:mt-0">
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="col-span-6 md:col-span-1 mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
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
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-white">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span>Filas por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-border rounded px-2 py-1 text-sm"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="ml-3">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} de {filtered.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded border border-border text-sm disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </button>
                <span className="text-sm text-secondary">Página {page} de {totalPages}</span>
                <button
                  className="px-3 py-1 rounded border border-border text-sm disabled:opacity-50"
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
