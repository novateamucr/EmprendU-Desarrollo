import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Layout } from '../components/layout/Layout';
import { ModalAnimaciones } from '../components/ui/ModalAnimaciones';
import { useState } from 'react';
import useScrollTop from '../hooks/useScrollTop';
import RealizarPedidoGif from '../assets/RealizarPedido.gif';
export default function Cart() {
  const { groups, removeItem, updateQty } = useCart();
  const navigate = useNavigate();
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);

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

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto p-6 mt-10">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          <span>Carrito de pedidos</span>

          {/* Botón pequeño junto al título */}
          <button
            onClick={() => setShowExtraModal(true)}
            className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Abrir información"
          >
            <Info className="w-4 h-4 text-gray-600" />
          </button>
        </h1>

        {groups.map((group) => (
          <div key={group.groupId || `${group.entrepreneurshipId}-${Math.random()}` } className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => navigate(`/business/${group.entrepreneurshipId}`)}
                className="text-lg font-semibold hover:underline text-left"
              >
                {group.entrepreneurshipName}
              </button>
              {group.status !== 'requested' && (
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

            {group.status === 'requested' && (
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
                        {item.selectionSummary && item.selectionSummary.length > 0 && (
                          <ul className="mt-1 text-xs text-gray-500 list-disc pl-4">
                            {item.selectionSummary.slice(0, 3).map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {group.status !== 'requested' && (
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
                      {group.status !== 'requested' && (
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
              </div>
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
          title="Información del carrito"
          variant="info"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Aquí puedes mostrar detalles importantes, tips de compra o información extra para el usuario.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowExtraModal(false)}
                className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brandDark"
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalAnimaciones>
      </div>
    </Layout>

  );
}
