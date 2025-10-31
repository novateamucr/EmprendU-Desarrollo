import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getOrder, updateOrderStatus } from '../services/orderService';
import { CheckCircle2, XCircle, BadgeCheck, Star, Wrench } from 'lucide-react';
import { getProfile } from '../domain/profile/service';

type BackendStatus = 'draft' | 'requested' | 'accepted' | 'canceled' | 'completed' | 'rated';

function mapStatus(s?: string) {
  const s2 = String(s || '').toLowerCase();
  if (s2 === 'requested' || s2 === 'draft') return { label: 'Pedido solicitado', cls: 'bg-sky-50 text-sky-700 border-sky-200' };
  if (s2 === 'accepted') return { label: 'Pedido aceptado', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  if (s2 === 'canceled') return { label: 'Pedido cancelado', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (s2 === 'completed') return { label: 'Pedido completado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (s2 === 'rated') return { label: 'Pedido calificado', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Pedido solicitado', cls: 'bg-sky-50 text-sky-700 border-sky-200' };
}

export default function EntrepreneurOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [updating, setUpdating] = useState<BackendStatus | null>(null);
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const data = await getOrder(String(id)); // includes items by default
        setOrder(data?.data || data);
        // Build address from profile
        const profile = await getProfile();
        const addr = [profile?.province, profile?.canton, profile?.district, profile?.address]
          .filter((p: any) => !!p && String(p).trim().length > 0)
          .join(', ');
        setAddress(addr);
      } catch (e: any) {
        setErr(e?.response?.data?.message || e?.message || 'Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const statusInfo = useMemo(() => mapStatus(order?.status), [order?.status]);

  async function doUpdate(next: BackendStatus) {
    if (!order) return;
    try {
      setUpdating(next);
      const updated = await updateOrderStatus(order.id, next);
      setOrder(updated?.data || updated);
    } catch (e) {
      // noop
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="pt-24 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white border border-border rounded-lg p-6 text-center text-sm text-secondary">Cargando pedido...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-24 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white border border-rose-200 text-rose-700 rounded-lg p-6 text-center text-sm">{err || 'No se encontró el pedido'}</div>
          <div className="text-center mt-4">
            <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-gray-50">Volver</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="pt-24 pb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-primary">Pedido {order.id}</h1>
            <p className="text-secondary text-sm">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <Link to="/entrepreneur/orders" className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-gray-50">Volver</Link>
        </div>

        <div className="bg-white border border-border rounded-lg p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full border shadow-sm ${statusInfo.cls}`}>{statusInfo.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {(order.status === 'requested' || order.status === 'draft') && (
                <button onClick={() => doUpdate('accepted')} disabled={!!updating} className="px-3 py-1.5 rounded-md border text-sm hover:bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
                  <CheckCircle2 size={16} /> Aceptar
                </button>
              )}
              {(order.status === 'requested' || order.status === 'draft' || order.status === 'accepted') && (
                <button onClick={() => doUpdate('canceled')} disabled={!!updating} className="px-3 py-1.5 rounded-md border text-sm hover:bg-rose-50 text-rose-700 border-rose-200 inline-flex items-center gap-1">
                  <XCircle size={16} /> Cancelar
                </button>
              )}
              {order.status === 'accepted' && (
                <button onClick={() => doUpdate('completed')} disabled={!!updating} className="px-3 py-1.5 rounded-md border text-sm hover:bg-indigo-50 text-indigo-700 border-indigo-200 inline-flex items-center gap-1">
                  <BadgeCheck size={16} /> Completar
                </button>
              )}
              {order.status === 'completed' && (
                <span className="px-3 py-1.5 rounded-md border text-sm bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1">
                  <Star size={16} /> Listo para calificar
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-gray-50 border border-border">
              <p className="text-xs text-secondary">Cliente</p>
              <p className="text-sm font-medium text-primary">{order.customer_name}</p>
              <p className="text-xs text-secondary">{order.customer_phone_8}</p>
              <p className="text-xs text-secondary">{order.customer_email}</p>
              {address && (
                <p className="text-xs text-secondary mt-1 whitespace-normal break-words">Dirección: {address}</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-border">
              <p className="text-xs text-secondary">Totales</p>
              <p className="text-sm text-secondary">Artículos: <span className="font-semibold text-primary">{Number(order.items_total || 0).toLocaleString()}</span></p>
              <p className="text-sm text-secondary">Envío: <span className="font-semibold text-primary">₡{Number(order.shipping_total || 0).toLocaleString()}</span></p>
              <p className="text-sm text-secondary">Descuento: <span className="font-semibold text-primary">₡{Number(order.discount_total || 0).toLocaleString()}</span></p>
              <p className="text-sm text-secondary mt-1">Gran total: <span className="font-semibold text-primary">₡{Number(order.grand_total || 0).toLocaleString()}</span></p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-border">
              <p className="text-xs text-secondary">Emprendimiento</p>
              <p className="text-sm font-medium text-primary">{order?.entrepreneurship?.name || order.entrepreneurship_name}</p>
              <p className="text-xs text-secondary">ID: {order.entrepreneurship_id}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-primary mb-2">Productos</h2>
            <div className="rounded-lg border border-border overflow-hidden bg-white">
              <div className="p-6 text-center text-secondary text-sm flex flex-col items-center gap-2">
                <Wrench className="w-6 h-6" />
                <span>Sección en construcción. Pronto verás los productos del pedido aquí.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
