import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Layout } from '../components/layout/Layout';
import { Modal } from '../components/Modal';
import { useMemo, useState } from 'react';

export default function CartDetail() {
  const { entrepreneurshipId } = useParams();
  const navigate = useNavigate();
  const { groups, updateQty, removeItem, placeOrder, isPlaced } = useCart();
  const [orderOpen, setOrderOpen] = useState(false);

  const group = useMemo(() => groups.find(g => g.entrepreneurshipId === entrepreneurshipId), [groups, entrepreneurshipId]);

  if (!group) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto mt-10 bg-white rounded-card shadow-soft border border-border p-6">
          <h1 className="text-2xl font-semibold text-primary mb-2">Carrito</h1>
          <p className="text-secondary mb-4">No se encontró el carrito solicitado.</p>
          <button onClick={() => navigate('/cart')} className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50">Volver</button>
        </div>
      </Layout>
    );
  }

  const handlePlaceOrder = async () => {
    await placeOrder(group.entrepreneurshipId);
    setOrderOpen(true);
  };

  const total = group.items.reduce((acc, it) => acc + it.price * it.quantity, 0);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto mt-10 bg-white rounded-card shadow-soft border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-primary">Carrito de {group.entrepreneurshipName}</h1>
            {isPlaced(group.entrepreneurshipId) && (
              <span className="text-xs text-brand italic">pedido realizado</span>
            )}
          </div>
          <button onClick={() => navigate('/cart')} className="text-sm text-brand hover:text-brandDark">Volver</button>
        </div>

        <div className="divide-y mt-6">
          {group.items.map(item => (
            <div key={item.productId} className="py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-primary font-medium truncate">{item.name}</p>
                <p className="text-sm text-secondary">₡{item.price.toLocaleString('es-CR')}</p>
              </div>

              {isPlaced(group.entrepreneurshipId) ? (
                <div className="flex items-center gap-2">
                  <span className="w-8 text-center">{item.quantity}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Disminuir"
                    onClick={() => updateQty(group.entrepreneurshipId, item.productId, item.quantity - 1)}
                    className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    aria-label="Aumentar"
                    onClick={() => updateQty(group.entrepreneurshipId, item.productId, item.quantity + 1)}
                    className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              )}

              <div className="text-right">
                <p className="text-primary font-medium">₡{(item.price * item.quantity).toLocaleString('es-CR')}</p>
                {!isPlaced(group.entrepreneurshipId) && (
                  <button
                    className="text-xs text-red-600 hover:underline mt-1"
                    onClick={() => removeItem(group.entrepreneurshipId, item.productId)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">
          <p className="text-primary font-semibold">Total</p>
          <p className="text-primary font-semibold">₡{total.toLocaleString('es-CR')}</p>
        </div>

        <div className="flex justify-end mt-6">
          {isPlaced(group.entrepreneurshipId) ? (
            <button
              // TODO: preparar ruta real de contacto con el emprendedor
              onClick={() => {
                const contactPath = `/contactar/${group.entrepreneurshipId}`;
                // Placeholder: navegación a ruta futura
                navigate(contactPath);
              }}
              className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brandDark transition-colors"
            >
              Contactar emprendedor
            </button>
          ) : (
            <button
              onClick={handlePlaceOrder}
              className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brandDark transition-colors"
            >
              Agregar al carrito
            </button>
          )}
        </div>
      </div>

      <Modal isOpen={orderOpen} onClose={() => setOrderOpen(false)} title="Pedido realizado">
        <div className="space-y-3 text-secondary text-sm">
          <p>Pedido realizado, se le comunicará al emprendedor.</p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setOrderOpen(false)}
              className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brandDark transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
