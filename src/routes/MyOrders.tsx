import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { listMyOrders } from '../services/orderService';
import { Clock, CheckCircle2, BadgeCheck, Star, XCircle } from 'lucide-react';
// import { Modal } from '../components/Modal';

// Types for orders shown in MyOrders
type OrderStatus = 'pedido_solicitado' | 'pedido_aceptado' | 'pedido_cancelado' | 'pedido_completado' | 'pedido_calificado';

type Order = {
  id: string;
  createdAt: string; // ISO date
  entrepreneurshipName: string;
  entrepreneurshipId: number;
  items: number;
  total: number; // in CRC
  status: OrderStatus;
  itemsSnapshot?: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
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

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const { groups } = useCart();

  // Derivar pedidos 'solicitados' desde el carrito (uno por grupo solicitado)
  const cartOrders: Order[] = useMemo(() => {
    return (groups || [])
      .filter(g => g.status === 'requested')
      .map(g => {
        const items = g.items.reduce((sum, it) => sum + (it.quantity ?? 0), 0);
        const total = g.items.reduce((sum, it) => sum + (it.price * (it.quantity ?? 0)), 0);
        return {
          id: String(g.orderId ?? g.groupId),
          createdAt: new Date().toISOString(),
          entrepreneurshipName: g.entrepreneurshipName,
          entrepreneurshipId: Number(g.entrepreneurshipId),
          items,
          total,
          status: 'pedido_solicitado' as OrderStatus,
          itemsSnapshot: g.items.map(it => ({
            productId: it.productId,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            imageUrl: it.imageUrl,
          })),
        };
      })
      .filter(o => o.items > 0);
  }, [groups]);

  // Cargar pedidos reales del backend y mezclar con los derivados del carrito (solicitados actuales)
  useEffect(() => {
    (async () => {
      try {
        // Try backend orders (sin filtros o con draft/requested)
        const attempts: any[] = [];
        attempts.push(await listMyOrders({ status: 'draft,requested' }).catch(() => null));
        attempts.push(await listMyOrders(undefined as any).catch(() => null));
        let raw: any[] = [];
        for (const res of attempts) {
          const arr = (res?.data && Array.isArray(res.data)) ? res.data : (Array.isArray(res) ? res : (res?.data?.data || res?.data || []));
          if (Array.isArray(arr) && arr.length) { raw = arr; break; }
        }
        const backendOrders: Order[] = (raw || []).map((o: any) => {
          const entre = o.entrepreneurship || {};
          const entrepreneurshipId = Number(o.entrepreneurship_id ?? entre.id ?? 0);
          const entrepreneurshipName = String(entre.name ?? o.entrepreneurship_name ?? `Emprendimiento #${entrepreneurshipId || ''}`);
          const items = Array.isArray(o.items) ? o.items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0) : 0;
          const total = Number(o.grand_total ?? 0);
          return {
            id: String(o.id),
            createdAt: String(o.created_at ?? new Date().toISOString()),
            entrepreneurshipName,
            entrepreneurshipId,
            items,
            total,
            status: mapStatus(o.status),
          } as Order;
        });

        // Merge backend + requested-from-cart (avoid duplicates by id)
        const mapById = new Map<string, Order>();
        backendOrders.forEach(o => mapById.set(o.id, o));
        cartOrders.forEach(co => {
          // If there's a backend order with same entrepreneurship and status requested, prefer backend; else include cart
          if (!mapById.has(co.id)) mapById.set(co.id, co);
        });
        setOrders(Array.from(mapById.values()));
      } catch {
        // Fallback: show only cart-derived orders
        setOrders(cartOrders);
      }
    })();
  }, [cartOrders]);

  const filtered = useMemo(() => {
    return orders
      .filter((o) => (statusFilter === 'all' ? true : o.status === statusFilter))
      .filter((o) =>
        query.trim() ? (
          o.id.toLowerCase().includes(query.toLowerCase()) ||
          o.entrepreneurshipName.toLowerCase().includes(query.toLowerCase())
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

  return (
    <div className="pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4">
  <h1 className="text-2xl md:text-3xl font-semibold text-primary">Mis pedidos</h1>
        <p className="text-secondary mt-1">Historial de pedidos y sus estados.</p>

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
            </select>
          </div>
          <input
            type="text"
            placeholder="Buscar por emprendimiento o código..."
            className="w-full md:w-80 border border-border rounded-md px-3 py-2 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mt-6 bg-white rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b text-xs text-secondary text-center">
            <div className="col-span-2">Emprendimiento</div>
            <div className="col-span-2">Código</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Artículos</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2">Estado</div>
          </div>
          {filtered.length === 0 && (
            <div className="p-6 text-center text-secondary text-sm">No hay pedidos para mostrar</div>
          )}
          <ul className="divide-y">
            {paged.map((o) => (
              <li
                key={o.id}
                className="px-4 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/orders/${o.id}`)}
                title="Ver detalle de pedido"
              >
                <div className="grid grid-cols-12 gap-4 items-center text-center">
                  <div className="col-span-12 md:col-span-2">
                    <div className="font-medium text-primary">{o.entrepreneurshipName}</div>
                    <div className="md:hidden text-xs text-secondary mt-0.5">{o.id}</div>
                  </div>
                  <div className="hidden md:block col-span-2 text-sm">{o.id}</div>
                  <div className="col-span-6 md:col-span-2 text-sm text-secondary">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                  <div className="col-span-3 md:col-span-2 text-sm">{o.items}</div>
                  <div className="col-span-3 md:col-span-2 text-sm font-semibold text-primary">
                    ₡{o.total.toLocaleString()}
                  </div>
                  <div className="col-span-12 md:col-span-2 flex items-center justify-center gap-2 mt-2 md:mt-0">
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {filtered.length > 0 && (
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
      {/* Cancel action removed from list; available in order detail view */}
    </div>
  );
}
