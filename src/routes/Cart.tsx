import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus, Info, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Layout } from '../components/layout/Layout';
import { ModalAnimaciones } from '../components/ui/ModalAnimaciones';
import useScrollTop from '../hooks/useScrollTop';
import { useState, useCallback } from 'react';
import RealizarPedidoGif from '../assets/animaciones/AnimacionRealizarPedido.gif';
import { toast } from 'react-toastify';
export default function Cart() {
  const { 
    groups, 
    removeItem, 
    updateQty, 
    placeOrder, 
    isPlacingOrder, 
    orderError,
    isPlaced
  } = useCart();
  const navigate = useNavigate();
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [currentOrderingGroup, setCurrentOrderingGroup] = useState<string | null>(null);

  const handlePlaceOrder = useCallback(async (entrepreneurshipId: string) => {
    setCurrentOrderingGroup(entrepreneurshipId);
    try {
      const result = await placeOrder(entrepreneurshipId);
      if (result.success) {
        toast.success('¡Pedido realizado con éxito!', {
          icon: <CheckCircle className="text-green-500 w-6 h-6" />,
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'bg-green-50 text-green-800',
          bodyClassName: 'flex items-center',
          progressClassName: 'bg-green-500',
        });
        
        // Scroll to the top to see the success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Optionally navigate to order confirmation
        // navigate(`/orders/${result.orderId}`);
      } else if (result.error) {
        toast.error(result.error, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: 'bg-red-50 text-red-800',
        });
      }
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Error al procesar el pedido. Por favor, inténtalo de nuevo.', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        className: 'bg-red-50 text-red-800',
      });
    } finally {
      setCurrentOrderingGroup(null);
    }
  }, [placeOrder]);

  // Ensure the cart view always loads scrolled to the top
  useScrollTop('auto');

  if (!groups.length) {
    return (
      <Layout>
        <div className="w-full max-w-4xl mx-auto p-6 mt-10">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            Carrito de pedidos

            {/* Botón pequeño junto al título */}
            <button
              onClick={() => setShowExtraModal(true)}
              className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Abrir información"
            >
              <Info className="w-4 h-4 text-gray-600" />
            </button>
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

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 mt-4 sm:mt-6 md:mt-10">
        <div className="items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Carrito de pedidos</span>
          </h1>
          <button
            onClick={() => setShowExtraModal(true)}
            className="p-1.5 sm:p-1 hover:bg-gray-100 hover:underline transition-colors text-gray-600"
            aria-label="Abrir información"
          >¿Cómo realizar un pedido?
          </button>
        </div>

        {groups.map((group) => (
          <div key={group.groupId || `${group.entrepreneurshipId}-${Math.random()}`} className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => navigate(`/business/${group.entrepreneurshipId}`)}
                  className="text-lg font-semibold text-gray-900 hover:text-brand transition-colors flex items-center gap-2"
                >
                  {group.entrepreneurshipName}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {group.status === 'requested' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Pedido realizado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pedido en carrito
                    </span>
                  )}
              </div>
              {orderError && group.entrepreneurshipId === currentOrderingGroup && (
                <div className="mt-2 text-sm text-red-600">{orderError}</div>
              )}
            </div>
            <div className="md:divide-y">
              {group.items.map((item) => (
                <div
                  key={item.productId}
                  onClick={() => navigate(`/product/${item.productId}`)}
                  className="p-4 cursor-pointer bg-white md:bg-transparent rounded-md md:rounded-none border md:border-0 shadow-sm md:shadow-none mb-3 md:mb-0"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-start md:items-center gap-3 min-w-0">
                      <img
                        src={item.imageUrl || 'https://placehold.co/100x100?text=Producto'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-medium hover:underline text-sm md:text-base line-clamp-2">{item.name}</h3>
                        <p className="text-sm text-gray-600">₡{item.price.toLocaleString()}</p>
                        {item.selectionSummary && item.selectionSummary.length > 0 && (
                          <ul className="mt-1 text-xs text-gray-500 list-disc pl-4 space-y-0.5">
                            {item.selectionSummary.slice(0, 2).map((s, idx) => (
                              <li key={idx} className="truncate">{s}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0">
                      <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
                        {group.status !== 'requested' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.quantity > 1) {
                                updateQty(group.entrepreneurshipId, item.productId, item.quantity - 1);
                              } else {
                                removeItem(group.entrepreneurshipId, item.productId);
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                            aria-label="Disminuir cantidad"
                          >
                            {item.quantity > 1 ? (
                              <Minus className="w-3.5 h-3.5" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </button>
                        )}
                        <span className="w-8 text-center text-sm md:text-base">{item.quantity}</span>
                        {group.status !== 'requested' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQty(group.entrepreneurshipId, item.productId, item.quantity + 1);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="text-right font-medium text-sm md:text-base">
                        ₡{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4 flex justify-between items-center border-t">
                <div className="text-sm text-gray-600">
                  {group.items.length} {group.items.length === 1 ? 'producto' : 'productos'} • Total:
                  <span className="font-semibold ml-1">
                    ₡{group.items.reduce((total, item) => total + (item.price * item.quantity), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span>₡{group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total:</span>
                <span className="text-brand">
                  ₡{group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                </span>
              </div>
              {group.status !== 'requested' && (
                <button
                  onClick={() => handlePlaceOrder(group.entrepreneurshipId)}
                  disabled={isPlacingOrder && currentOrderingGroup === group.entrepreneurshipId}
                  className={`mt-4 w-full py-3 rounded-md font-medium text-sm ${
                    isPlacingOrder && currentOrderingGroup === group.entrepreneurshipId
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-brand text-white hover:bg-brandDark'
                  } transition-colors`}
                >
                  {isPlacingOrder && currentOrderingGroup === group.entrepreneurshipId ? (
                    'Procesando tu pedido...'
                  ) : (
                    'Realizar Pedido'
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Modal existente de recordatorio de perfil (usando ModalAnimaciones) */}
        <ModalAnimaciones
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
        </ModalAnimaciones>

        {/* Modal extra (info) - reutilizado en la vista con contenido */}
        <ModalAnimaciones
            isOpen={showExtraModal}
            onClose={() => setShowExtraModal(false)}
            title="¿Cómo realizar un pedido?"
            pointerGifSrc={RealizarPedidoGif}
            notice={{
              title: 'Completa la Información de tu perfil',
              description: 'Para poder realizar un pedido, debes de tener completa toda la información de tu perfil'
            }}
          >
            <div className="space-y-4 text-gray-700 text-sm">
              <div>
                <p className="font-semibold">Agrega productos al carrito</p>
                <p>Agrega productos al carrito para poder realizar un pedido</p>
              </div>

              <div>
                <p className="font-semibold">En el Carrito - Haz click en “Confirmar pedido”</p>
                <p>En el carrito podrás ver los productos que agregaste al carrito</p>
              </div>

              <div>
                <p className="font-semibold">Espera confirmación del emprendimiento</p>
                <p>El emprendimiento se puede poner en contacto a la hora de visualizar tu pedido, o te lo puede confirmar sin necesidad de contacto</p>
              </div>

              <div>
                <p className="font-semibold">Revisa el estado de tu pedido</p>
                <p>Este paso es importante para que el emprendimiento te deje saber si puede aceptar el pedido</p>
              </div>
            </div>
          </ModalAnimaciones>
      </div>
    </Layout>

  );
}
