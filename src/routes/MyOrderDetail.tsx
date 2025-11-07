import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { getOrder, cancelOrder } from '../services/orderService';
import { getProductsByIds } from '../services/productService';
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
};

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const statusMap = {
    requested: { label: 'Solicitado', color: 'bg-yellow-100 text-yellow-800' },
    accepted: { label: 'Aceptado', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
    canceled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    rated: { label: 'Calificado', color: 'bg-purple-100 text-purple-800' },
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusMap[status]?.color || 'bg-gray-100 text-gray-800'
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
      
      const orderData = response.data.data;
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
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Cargando información del pedido...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Error</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {error || 'No se encontró el pedido solicitado'}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
    <div className="pt-24 pb-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-primary">
              Pedido #{order.id}
            </h1>
            <p className="text-lg text-gray-600">
              {formatDate(order.created_at)}
            </p>
          </div>
          <Link
            to="/orders"
            className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
          >
            Volver a mis pedidos
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Order Status */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Estado del pedido</h2>
                <div className="mt-1">
                  <StatusBadge status={order.status} />
                </div>
              </div>
              {canCancelOrder && (
                <button
                  onClick={() => setCancelOpen(true)}
                  className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancelar pedido
                </button>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Emprendimiento</h3>
              <p className="mt-1 text-sm text-gray-900">{order.entrepreneurship_name}</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
              <p className="mt-1 text-sm text-gray-900">{order.customer_name}</p>
              <p className="text-sm text-gray-600">{order.customer_email}</p>
              <p className="text-sm text-gray-600">Tel: {order.customer_phone_8}</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <h3 className="text-sm font-medium text-gray-500">Detalles del pago</h3>
              <p className="mt-1 text-sm text-gray-900">Efectivo al recoger</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Productos</h3>
            </div>
            <div className="border-t border-gray-200 divide-y divide-gray-200">
              {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                order.items.map((item) => {
                  console.log('Order item:', item); // Debug log
                  const totalPrice = (item.unit_price * item.quantity) + (item.options_total || 0);
                  
                  return (
                    <div key={item.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                            <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                              {item.product_details?.image_url ? (
                                <img
                                  src={item.product_details.image_url}
                                  alt={item.product_details.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiA5Q0EwQjkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1wYWNrYWdlIj48cGF0aCBkPSJNMTYuNSA5LjQgNy41IDRjLTEgLjU3Ni0xLjYxNiAxLjQyLTEuNjE2IDIuNnY2LjgxYzAgMS4xOCAuNjE2IDIuMDI0IDEuNjE2IDIuNmw5IDUuNGMxIC41NzYgMi42MTYuNTc2IDMuNjE2IDBsOS01LjRjMS0uNTc2IDEuNjE2LTEuNDIgMS42MTYtMi42di02LjgxYzAtMS4xOC0uNjE2LTIuMDI0LTEuNjE2LTIuNmwtOS01LjRhMS44MTUgMS44MTUgMCAwIDAtMS44MzggMGwtLjE2Mi4wOTciLz48cGF0aCBkPSJtMTYuNSA5LjQtOS01LjQiLz48cGF0aCBkPSJNMTYuNSA5LjR2Ni44MWMwIDEuMTgtLjYxNiAyLjAyNC0xLjYxNiAyLjZsLTkgNS40Ii8+PHBhdGggZD0ibTE2LjUgOS40LTkgNS40Ii8+PC9zdmc+'
                                  }}
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                  <svg
                                    className="h-8 w-8 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1}
                                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          <div className="ml-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {item.product_details?.name || item.product_name || `Producto #${item.product_id}`}
                              </h4>
                              {item.product_details?.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {item.product_details.description}
                                </p>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              Cantidad: {item.quantity} × ₡{item.unit_price?.toLocaleString()}
                            </p>
                            {item.product_details && (
                              <Link
                                to={`/product/${item.product_id}`}
                                className="inline-flex items-center mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                Ver producto
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            )}
                            
                            {/* Display options if they exist */}
                            {item.order_options && item.order_options.length > 0 && (
                              <div className="mt-1 text-xs text-gray-500">
                                {item.order_options.map((option, idx) => (
                                  <div key={idx}>
                                    {option.option_name}: {option.option_value}
                                    {option.price_delta > 0 && ` (+₡${option.price_delta.toLocaleString()})`}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {item.options_total > 0 && (
                              <p className="text-xs text-gray-500">
                                Opciones: ₡{item.options_total.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ₡{totalPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No hay productos en este pedido
                </div>
              )}
            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-gray-50 px-4 py-5 sm:px-6">
            <div className="flex justify-between text-base font-medium text-gray-900">
              <p>Subtotal</p>
              <p>₡{order.items_total?.toLocaleString() || '0'}</p>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <p>Envío</p>
              <p>₡{order.shipping_total?.toLocaleString() || '0'}</p>
            </div>
            {order.discount_total > 0 && (
              <div className="mt-2 flex justify-between text-sm text-green-600">
                <p>Descuento</p>
                <p>-₡{order.discount_total?.toLocaleString() || '0'}</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-lg font-medium text-gray-900">
              <p>Total</p>
              <p>₡{order.grand_total?.toLocaleString() || '0'}</p>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Notas del pedido</h3>
              <p className="mt-1 text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Cancel Order Dialog */}
        <Dialog open={cancelOpen} onClose={() => !isSubmitting && setCancelOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6">
              <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                ¿Estás seguro de que deseas cancelar este pedido?
              </Dialog.Title>
              <p className="text-sm text-gray-600 mb-6">
                Esta acción no se puede deshacer. El pedido se marcará como cancelado.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCancelOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  No, mantener el pedido
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
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