import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { getOrder, cancelOrder } from '../services/orderService';
import { getProductsByIds, type Product } from '../services/productService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Types
type OrderStatus = 'requested' | 'accepted' | 'completed' | 'canceled' | 'rated';

type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string | null;

  product_details?: {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    entrepreneurship?: {
      id: number;
      name: string;
    };
  };
  quantity: number;
  unit_price: number;
  options_total: number;
  subtotal: number;
  order_options: any[];
  options?: any[];
};

type Order = {
  id: number;
  entrepreneurship_id: number;
  entrepreneurship_name: string;
  entrepreneurship: {
    id: number;
    name: string;
  };
  customer_name: string;
  customer_phone_8: string;
  customer_email: string;
  status: OrderStatus;
  items_total: number;
  options_total: number;
  shipping_total: number;
  discount_total: number;
  grand_total: number;
  currency: string;
  notes: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  additional_location?: {
    id: number;
    province: string;
    canton: string;
    district: string;
    direccion_breve?: string;
  } | null;
};

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const statusMap = {
    requested: { label: 'Solicitado', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
    accepted: { label: 'Aceptado', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
    completed: { label: 'Completado', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
    canceled: { label: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
    rated: { label: 'Calificado', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMap[status]?.color || 'bg-gray-100 text-gray-800'
        }`}
    >
      {statusMap[status]?.label || status}
    </span>
  );
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Fecha no disponible';

  try {
    // Handle ISO 8601 format with timezone
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    return format(date, "d 'de' MMMM 'de' yyyy 'a las' hh:mm a", { locale: es });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Fecha inválida';
  }
};

export default function MyOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  const fetchProductsForOrder = async (items: OrderItem[]) => {
    if (!items || items.length === 0) return [];

    try {
      setProductsLoading(true);
      const productIds = items.map(item => item.product_id);
      const products = await getProductsByIds(productIds);
      return products;
    } catch (error) {
      console.error('Error fetching product details:', error);
      return [];
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await getOrder(id);

        if (!isMounted) return;

        const orderData = response.data;
        setOrder(orderData);

        if (orderData.items?.length > 0) {
          const products = await fetchProductsForOrder(orderData.items);

          if (!isMounted) return;

          const updatedItems = orderData.items.map((item: OrderItem) => ({
            ...item,
            product_details: products.find((p: Product) => p.id === item.product_id)
          }));

          setOrder(prev => prev ? { ...prev, items: updatedItems } : null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching order:', err);
        setError('No se pudo cargar la información del pedido');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [id]);
  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      setIsSubmitting(true);

      // Show loading toast
      const toastId = toast.loading('Cancelando pedido...');

      // Call the API to cancel the order
      await cancelOrder(String(order.id));

      // Update the local state to reflect the cancellation
      setOrder(prev => prev ? {
        ...prev,
        status: 'canceled',
        updated_at: new Date().toISOString()
      } : null);

      // Close the confirmation dialog
      setCancelOpen(false);

      // Update toast to show success
      toast.success('El pedido ha sido cancelado exitosamente.', {
        id: toastId,
        duration: 5000,
      });

    } catch (error) {
      console.error('Error canceling order:', error);

      // Show error toast
      toast.error('No se pudo cancelar el pedido. Por favor, intente nuevamente.', {
        duration: 5000,
      });

      setError('No se pudo cancelar el pedido. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-backgroundDark py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Cargando información del pedido...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-backgroundDark py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-cardDark shadow overflow-hidden sm:rounded-lg dark:border dark:border-cardDark">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Error</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                {error || 'No se encontró el pedido solicitado'}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Volver atrás
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canCancelOrder = order.status === 'requested' && order.items?.length > 0;

  return (
    <div className="pt-24 pb-8 bg-gray dark:bg-backgroundDark min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-primary dark:text-white">
              Pedido #{order.id}
            </h1>
            <p className="text-lg text-gray-600 dark:text-secondaryDark">
              {formatDate(order.created_at)}
            </p>
          </div>
          <Link
            to="/orders"
            className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-cardDark text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-brandDark transition-colors duration-200"
          >
            Volver a mis pedidos
          </Link>
        </div>

        <div className="bg-white dark:bg-cardDark shadow overflow-hidden sm:rounded-lg dark:border dark:border-cardDark">
          {/* Order Status */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-cardDark">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Estado del pedido</h2>
                <div className="mt-1">
                  <StatusBadge status={order.status} />
                </div>
              </div>
              {canCancelOrder && (
                <button
                  onClick={() => setCancelOpen(true)}
                  className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-cardDark focus:ring-red-500"
                >
                  Cancelar pedido
                </button>
              )}
            </div>
          </div>

          {/* Order Summary (sin detalles de pago) */}
          <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-200 dark:border-cardDark">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Emprendimiento</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {order.entrepreneurship_name}
              </p>
            </div>

            <div className="mt-4 sm:mt-0 sm:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {order.customer_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {order.customer_email}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tel: {order.customer_phone_8}
              </p>

              {/* Delivery Address */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Dirección de entrega
                </h4>
                {order.additional_location ? (
                  <p className="text-sm text-gray-900 dark:text-white">
                    {order.additional_location.province}, {order.additional_location.canton}, {order.additional_location.district}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    Dirección del perfil del cliente
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t border-gray-200 dark:border-cardDark">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Productos
              </h3>

              {order.items && order.items.length > 0 ? (
                <div className="space-y-6">
                  {order.items.map((item) => {
                    const formOptions =
                      item.order_options && item.order_options.length > 0
                        ? item.order_options
                        : item.options && Array.isArray(item.options)
                          ? item.options
                          : [];

                    return (
                      <div
                        key={item.id}
                        className="flex items-start border-b border-gray-100 dark:border-cardDark pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                          {item.product_details?.image_url ? (
                            <img
                              src={item.product_details.image_url}
                              className="h-full w-full object-cover object-center"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                              Sin imagen
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.product_details?.name ||
                                  item.product_name ||
                                  `Producto #${item.product_id}`}
                              </h4>

                              {item.product_details?.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {item.product_details.description}
                                </p>
                              )}

                              {formOptions && formOptions.length > 0 && (
                                <div className="mt-2 bg-gray-50 dark:bg-backgroundDark/50 rounded-md px-3 py-2">
                                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                    Detalles del formulario
                                  </p>
                                  <dl className="space-y-2">
                                    {formOptions.map((option: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="text-xs border-l border-gray-200 dark:border-cardDark pl-2"
                                      >
                                        <dt className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                                          {option.option_name}
                                        </dt>
                                        <dd className="mt-0.5 text-[11px] text-gray-700 dark:text-gray-300 break-words">
                                          <span className="text-gray-800 dark:text-gray-100">
                                            {option.option_value}
                                          </span>
                                          {option.price_delta > 0 && (
                                            <span className="text-[10px] text-green-600 dark:text-green-400 ml-1 font-medium">
                                              (+₡{option.price_delta.toLocaleString()})
                                            </span>
                                          )}
                                        </dd>
                                      </div>
                                    ))}
                                  </dl>
                                </div>
                              )}
                            </div>

                            <p className="ml-4 text-sm font-medium text-gray-900 dark:text-white">
                              ₡{(item.unit_price * item.quantity).toLocaleString()}
                            </p>
                          </div>

                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Cantidad: {item.quantity} × ₡{item.unit_price?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  No hay productos en este pedido.
                </p>
              )}
            </div>
          </div>

          {/* Order Totals (simple, funcionalidad tuya) */}
          <div className="bg-gray-50 dark:bg-backgroundDark/50 px-4 py-5 sm:px-6 border-t border-gray-200 dark:border-cardDark">
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-cardDark flex justify-between items-center">
              <p className="text-base font-medium text-gray-900 dark:text-white">
                Total del pedido
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                ₡{(order.grand_total ?? order.items_total)?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Cancel Order Dialog */}
        <Dialog
          open={cancelOpen}
          onClose={() => !isSubmitting && setCancelOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-lg bg-white dark:bg-cardDark p-6 dark:border dark:border-cardDark">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                ¿Estás seguro de que deseas cancelar este pedido?
              </Dialog.Title>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Esta acción no se puede deshacer. El pedido se marcará como cancelado.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCancelOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-cardDark border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-cardDark focus:ring-blue-500 disabled:opacity-50"
                >
                  No, mantener el pedido
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 border border-transparent rounded-md shadow-sm hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-cardDark focus:ring-red-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Cancelando...' : 'Sí, cancelar pedido'}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

      </div>
    </div>
  );
}
