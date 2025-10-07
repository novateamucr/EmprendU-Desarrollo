import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import BusinessFeedbackPopup from '../components/ui/BusinessFeedback';
import { useAuth } from '../context/AuthContext';

// Keep types in sync with MyOrders.tsx
export type OrderStatus = 'pedido_solicitado' | 'pedido_aceptado' | 'pedido_completado' | 'pedido_calificado';

export type Order = {
  id: string;
  createdAt: string;
  entrepreneurshipName: string;
  entrepreneurshipId: number;
  items: number;
  total: number;
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
    pedido_solicitado: 'bg-gray-100 text-gray-700 border-gray-200',
    pedido_aceptado: 'bg-blue-100 text-blue-700 border-blue-200',
    pedido_completado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pedido_calificado: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${styles[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const STORAGE_KEY = 'mock_orders_history';

export default function MyOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setOrders(raw ? JSON.parse(raw) : []);
    } catch {
      setOrders([]);
    }
  }, []);

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  if (!order) {
    return (
      <div className="pt-24 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white border border-border rounded-lg p-6 text-center">
            <p className="text-secondary mb-4">No se encontró el pedido.</p>
            <button
              className="px-4 py-2 rounded-md border border-border text-sm hover:bg-gray-50"
              onClick={() => navigate('/orders')}
            >
              Volver a mis pedidos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Pedido {order.id}</h1>
            <p className="text-secondary text-sm">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <Link
            to="/orders"
            className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-gray-50"
          >
            Volver
          </Link>
        </div>

        <div className="bg-white border border-border rounded-lg p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <p className="text-sm text-secondary">Emprendimiento</p>
              <p className="font-medium text-primary">{order.entrepreneurshipName}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-secondary">Estado</p>
              <StatusBadge status={order.status} />
            </div>
          </div>

          {order.status === 'pedido_solicitado' && (
            <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
              El emprendedor ya sabe de tu pedido, espera a que lo acepte o se contacte con usted.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-gray-50 border border-border">
              <p className="text-xs text-secondary">Artículos</p>
              <p className="text-lg font-semibold text-primary">{order.items}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-border">
              <p className="text-xs text-secondary">Total</p>
              <p className="text-lg font-semibold text-primary">₡{order.total.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-border">
              <p className="text-xs text-secondary">Fecha</p>
              <p className="text-lg font-semibold text-primary">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="text-sm text-secondary">
            <p>
              Este es un detalle mock del pedido. Una vez el backend esté listo, aquí mostraremos los productos,
              direcciones, contacto, y acciones según el estado.
            </p>
          </div>

          {order.status === 'pedido_solicitado' && order.itemsSnapshot && order.itemsSnapshot.length > 0 && (
            <div className="pt-2">
              <h2 className="text-lg font-semibold text-primary mb-3">Productos del pedido</h2>
              <div className="divide-y rounded-lg border border-border overflow-hidden bg-white">
                {order.itemsSnapshot.map((it) => (
                  <div key={it.productId} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={it.imageUrl || 'https://placehold.co/64x64?text=Producto'}
                        alt={it.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <div className="text-sm font-medium text-primary">{it.name}</div>
                        <div className="text-xs text-secondary">Cantidad: {it.quantity}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-primary">₡{(it.price * it.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.status === 'pedido_completado' && (
            <div className="pt-2">
              <button
                className="px-4 py-2 rounded-md bg-brand text-white text-sm font-medium hover:bg-brandDark transition-colors"
                onClick={() => setShowPopup(true)}
                disabled={submitting}
              >
                Calificar emprendimiento
              </button>
            </div>
          )}

          {showPopup && (
            <BusinessFeedbackPopup
              show={showPopup}
              title="¡Califica tu experiencia!"
              imageUrl={''}
              onSubmit={async (rating: number, comments: string) => {
                if (!order) return;
                setSubmitting(true);
                try {
                  const res = await fetch('http://emprendu-backend.test/api/reviews', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                      rating,
                      review: comments,
                      user_id: user?.id,
                      entrepreneurship_id: order.entrepreneurshipId,
                    }),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || 'Error al enviar el review');
                  }
                  // Update local storage to reflect calificado state
                  const updated = orders.map(o => o.id === order.id ? { ...o, status: 'pedido_calificado' as OrderStatus } : o);
                  setOrders(updated);
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                  setShowPopup(false);
                } catch (e) {
                  alert((e as Error).message);
                } finally {
                  setSubmitting(false);
                }
              }}
              onCancel={() => setShowPopup(false)}
            />
          )}

        </div>
      </div>
    </div>
  );
}
