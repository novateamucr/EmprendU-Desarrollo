import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Layout } from '../components/layout/Layout';
import { Modal } from '../components/Modal';
import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { groups, placeOrder, isPlaced, updateQty, removeItem } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const [orderFor, setOrderFor] = useState<string | null>(null);

  const isProfileComplete = () => {
    return !! (user?.phone && user?.province && user?.canton && user?.district && user?.address);
  };
  const handlePlaceOrder = async (entrepreneurshipId: string) => {
    if (!isProfileComplete()) {
      setShowProfileReminder(true);
      return;
    }
    await placeOrder(entrepreneurshipId);
    setOrderFor(entrepreneurshipId);
  };

  const grandTotal = useMemo(() => {
    return groups.reduce((sum, g) => sum + g.items.reduce((acc, it) => acc + it.price * it.quantity, 0), 0);
  }, [groups]);

  if (!groups.length) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto mt-10 bg-white rounded-card shadow-soft border border-border p-6">
          <h1 className="text-2xl font-semibold text-primary mb-4">Tu carrito</h1>
          <p className="text-secondary">No tienes productos en tus carritos.</p>
        </div>
      </Layout>
    );
  }

  return (
    
    <Layout>
      <div className="max-w-4xl mx-auto mt-10 space-y-6">
        <h1 className="text-2xl font-semibold text-primary">Tu carrito</h1>
        {groups.map(group => (
          <div key={group.entrepreneurshipId} className="bg-white rounded-card shadow-soft border border-border p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                  {group.entrepreneurshipName}
                  <span
                    aria-label="Cantidad de productos de este emprendimiento"
                    className="w-6 h-6 rounded-full bg-brand/20 text-brandDark text-xs font-semibold flex items-center justify-center"
                    title={`${group.items.reduce((acc, it) => acc + it.quantity, 0)} productos`}
                  >
                    {group.items.reduce((acc, it) => acc + it.quantity, 0)}
                  </span>
                </h2>
                {isPlaced(group.entrepreneurshipId) && (
                  <span className="text-xs text-brand italic">pedido realizado</span>
                )}
              </div>
              {/* Botón de editar/ver eliminado: edición ahora es inline */}
            </div>

            <div className="divide-y">
              {group.items.map(item => (
                <div key={item.productId} className="py-3 flex items-center justify-between gap-4">
                  {/* Nombre del producto */}
                  <div className="min-w-0 flex-1">
                    <p className="text-primary font-medium truncate">{item.name}</p>
                  </div>

                  {/* Precio en el centro (reemplaza 'x cantidad') */}
                  <div className="text-primary whitespace-nowrap">
                    ₡{(item.price * item.quantity).toLocaleString('es-CR')}
                  </div>

                  {/* Controles a la derecha (reemplazan el precio) */}
                  <div className="shrink-0">
                    {isPlaced(group.entrepreneurshipId) ? (
                      <div className="px-4 py-2 rounded-full bg-gray-100 text-secondary text-sm select-none">
                        x{item.quantity}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
                        {item.quantity <= 1 ? (
                          <button
                            aria-label="Eliminar"
                            onClick={() => removeItem(group.entrepreneurshipId, item.productId)}
                            className="group w-8 h-8 rounded flex items-center justify-center hover:bg-brand/10"
                          >
                            <Trash2 className="w-4 h-4 text-secondary group-hover:text-brand" />
                          </button>
                        ) : (
                          <button
                            aria-label="Disminuir"
                            onClick={() => updateQty(group.entrepreneurshipId, item.productId, item.quantity - 1)}
                            className="group w-8 h-8 rounded flex items-center justify-center hover:bg-brand/10"
                          >
                            <Minus className="w-4 h-4 text-secondary group-hover:text-brand" />
                          </button>
                        )}
                        <span className="w-6 text-center text-primary">{item.quantity}</span>
                        <button
                          aria-label="Aumentar"
                          onClick={() => updateQty(group.entrepreneurshipId, item.productId, item.quantity + 1)}
                          className="group w-8 h-8 rounded flex items-center justify-center hover:bg-brand/10"
                        >
                          <Plus className="w-4 h-4 text-secondary group-hover:text-brand" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal por emprendimiento */}
            <div className="flex items-center justify-between mt-4 border-t border-border pt-3">
              <span className="text-primary font-semibold">Subtotal</span>
              <span className="text-primary font-semibold">
                ₡{group.items.reduce((acc, it) => acc + it.price * it.quantity, 0).toLocaleString('es-CR')}
              </span>
            </div>

            <div className="flex justify-end mt-4">
              {isPlaced(group.entrepreneurshipId) ? (
                <button
                  onClick={() => navigate(`/contactar/${group.entrepreneurshipId}`)}
                  className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brandDark transition-colors"
                >
                  Contactar emprendedor
                </button>
              ) : (
                <button
                  onClick={() => handlePlaceOrder(group.entrepreneurshipId)}
                  className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brandDark transition-colors"
                >
                  Hacer pedido
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total general de pedidos */}
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-white rounded-card shadow-soft border border-border p-4 flex items-center justify-between">
          <p className="text-brand font-semibold">Total de pedidos</p>
          <p className="text-primary font-semibold">₡{grandTotal.toLocaleString('es-CR')}</p>
        </div>
      </div>

      <Modal
        isOpen={!!orderFor}
        onClose={() => setOrderFor(null)}
        title="Pedido realizado"
      >
        <div className="space-y-3 text-secondary text-sm">
          <p>Pedido realizado, se le comunicará al emprendedor.</p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setOrderFor(null)}
              className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brandDark transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
      isOpen={showProfileReminder}
      onClose={() => setShowProfileReminder(false)}
      title="Perfil incompleto"
    >
      <div className="space-y-3 text-secondary text-sm">
        <p>Tu perfil no está completo. Por favor, completa tu información antes de realizar un pedido.</p>
        <div className="flex justify-end pt-2 gap-2">
          <button
            onClick={() => {
              setShowProfileReminder(false);
              navigate('/profile'); // redirige a la página de perfil
            }}
            className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brandDark transition-colors"
          >
            Completar perfil
          </button>
          <button
            onClick={() => setShowProfileReminder(false)}
            className="px-6 py-2 bg-gray-200 text-primary rounded-lg font-medium hover:bg-red-600 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>

    </Layout>
  );
}
