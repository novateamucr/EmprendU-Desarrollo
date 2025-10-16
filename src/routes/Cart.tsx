import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Layout } from '../components/layout/Layout';
import { Modal } from '../components/Modal';
import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Cart() {
  const { groups, placeOrder, isPlaced, removeItem, clearCart, updateQty } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const [placingId, setPlacingId] = useState<string | null>(null);

  const isProfileComplete = () => {
    return !!(user?.phone && user?.province && user?.canton && user?.district && user?.address);
  };

  const grandTotal = useMemo(() => {
    return groups.reduce((sum, g) => sum + g.items.reduce((acc, it) => acc + it.price * it.quantity, 0), 0);
  }, [groups]);

  if (!groups.length) {
    return (
      <Layout>
        <div className="w-full max-w-4xl mx-auto p-6 mt-10">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            Carrito de pedidos
          </h1>
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-4">Tu carrito está vacío</p>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brandDark transition-colors"
            >
              Seguir comprando
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handlePlaceOrder = async (entrepreneurshipId: string) => {
    if (!user?.phone || !user?.address) {
      setShowProfileReminder(true);
      return;
    }

    try {
      setPlacingId(entrepreneurshipId);
      await placeOrder(entrepreneurshipId);
      toast.success('Pedido realizado con éxito');

      // If this was the last group, clear the cart
      if (groups.length === 1) {
        clearCart();
        navigate('/home');
      }
    } catch (error) {
      console.error('Error al realizar el pedido:', error);
      toast.error('Error al realizar el pedido. Por favor, inténtalo de nuevo.');
    } finally {
      setPlacingId(null);
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto p-6 mt-10">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          <span>Carrito de pedidos</span>
        </h1>
        {groups.map((group) => (
          <div key={group.entrepreneurshipId} className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => navigate(`/business/${group.entrepreneurshipId}`)}
                className="text-lg font-semibold hover:underline text-left"
              >
                {group.entrepreneurshipName}
              </button>
              {!isPlaced(group.entrepreneurshipId) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    group.items.forEach(item => {
                      removeItem(group.entrepreneurshipId, item.productId);
                    });
                  }}
                  className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar todo</span>
                </button>
              )}
            </div>

            {isPlaced(group.entrepreneurshipId) && (
              <div className="mx-4 mb-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                El emprendedor ya sabe de tu pedido, espera a que lo acepte o se contacte con usted.
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm divide-y ">
              {group.items.map((item) => (
                <div 
                  key={item.productId} 
                  className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/product/${item.productId}`)}
                >
                  <div className="flex w-full justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.imageUrl || 'https://placehold.co/100x100?text=Producto'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <h3 className="font-medium hover:underline">{item.name}</h3>
                        <p className="text-sm text-gray-600">₡{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isPlaced(group.entrepreneurshipId) && (
                        <>
                          {item.quantity > 1 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQty(group.entrepreneurshipId, item.productId, item.quantity - 1);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(group.entrepreneurshipId, item.productId);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      <span className="w-8 text-center">{item.quantity}</span>
                      {!isPlaced(group.entrepreneurshipId) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQty(group.entrepreneurshipId, item.productId, item.quantity + 1);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      <div className="w-20 text-right font-medium">
                        ₡{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-4 flex justify-between items-center border-t ">
                <div className="text-sm text-gray-600">
                  {group.items.length} {group.items.length === 1 ? 'producto' : 'productos'} • Total:
                  <span className="font-semibold ml-1">
                    ₡{group.items.reduce((total, item) => total + (item.price * item.quantity), 0).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handlePlaceOrder(group.entrepreneurshipId)}
                  disabled={isPlaced(group.entrepreneurshipId) || placingId === group.entrepreneurshipId}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 ${isPlaced(group.entrepreneurshipId)
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-brand text-white hover:bg-brandDark'
                    }`}
                >
                  {placingId === group.entrepreneurshipId ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : isPlaced(group.entrepreneurshipId) ? (
                    'Pedido solicitado'
                  ) : (
                    'Confirmar pedido'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        <Modal
          isOpen={showProfileReminder}
          onClose={() => setShowProfileReminder(false)}
          title="Información requerida"
          variant="info"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Para realizar un pedido, necesitamos que completes tu información de perfil, incluyendo tu número de teléfono y dirección.
            </p>
            <p className="text-sm text-gray-600">
              Esta información es necesaria para que el emprendedor pueda contactarte y coordinar la entrega de tu pedido.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowProfileReminder(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowProfileReminder(false);
                  navigate('/profile');
                }}
                className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brandDark"
              >
                Completar perfil
              </button>
            </div>
          </div>
        </Modal>
      </div>
  </Layout >
              
  );
}
