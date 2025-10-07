import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Clock, CheckCircle2, BadgeCheck, Star } from 'lucide-react';

// Types for mock orders
type OrderStatus = 'pedido_solicitado' | 'pedido_aceptado' | 'pedido_completado' | 'pedido_calificado';

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
  pedido_completado: 'Pedido completado',
  pedido_calificado: 'Pedido calificado',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    pedido_solicitado: 'bg-sky-50 text-sky-700 border-sky-200',
    pedido_aceptado: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pedido_completado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pedido_calificado: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const icons: Record<OrderStatus, JSX.Element> = {
    pedido_solicitado: <Clock size={14} className="shrink-0" />,
    pedido_aceptado: <CheckCircle2 size={14} className="shrink-0" />,
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

const STORAGE_KEY = 'mock_orders_history';

function ensureSeeded() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return;
  const seed: Order[] = [
    // Evitamos sembrar un pedido en estado 'pedido_solicitado'. Esos vendrán del carrito.
    {
      id: 'ORD-2025-002',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      entrepreneurshipName: 'Café Luna',
      entrepreneurshipId: 102,
      items: 1,
      total: 3500,
      status: 'pedido_aceptado',
    },
    {
      id: 'ORD-2025-003',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      entrepreneurshipName: 'Panadería Del Sol',
      entrepreneurshipId: 103,
      items: 5,
      total: 12500,
      status: 'pedido_completado',
    },
    {
      id: 'ORD-2025-004',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      entrepreneurshipName: 'Artesanías Tica',
      entrepreneurshipId: 104,
      items: 3,
      total: 21000,
      status: 'pedido_calificado',
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const { groups, isPlaced } = useCart();

  // Derivar pedidos 'solicitados' desde el carrito (uno por emprendimiento)
  const cartOrders: Order[] = useMemo(() => {
    return (groups || [])
      .filter(g => isPlaced(g.entrepreneurshipId))
      .map(g => {
        const items = g.items.reduce((sum, it) => sum + (it.quantity ?? 0), 0);
        const total = g.items.reduce((sum, it) => sum + (it.price * (it.quantity ?? 0)), 0);
        return {
          id: `CART-${g.entrepreneurshipId}`,
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
  }, [groups, isPlaced]);

  // Cargar base desde storage y mezclar con pedidos derivados del carrito.
  useEffect(() => {
    ensureSeeded();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let base: Order[] = raw ? JSON.parse(raw) : [];
      // Emprendimientos confirmados actualmente (para reemplazar sus CART-* entries)
      const currentCartEntreIds = new Set(cartOrders.map(o => o.entrepreneurshipId));
      // Mantener CART-* anteriores que no estén siendo reemplazados por los actuales
      const preserved = base.filter(o => {
        if (!String(o.id).startsWith('CART-')) return true;
        const idNum = Number(String(o.id).replace('CART-', ''));
        return !currentCartEntreIds.has(idNum);
      });
      const merged = [...cartOrders, ...preserved];
      setOrders(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      setOrders(cartOrders);
    }
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
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Mis pedidos</h1>
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
                  <div className="col-span-12 md:col-span-2 flex md:justify-center mt-2 md:mt-0">
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
    </div>
  );
}
