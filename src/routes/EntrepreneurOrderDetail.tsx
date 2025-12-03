import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getOrder, updateOrderStatus } from "../services/orderService";
import { getProductsByIds, type Product } from "../services/productService";
import {
  CheckCircle2,
  XCircle,
  BadgeCheck,
  Star,
  Wrench,
  Package,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getProfile } from "../domain/profile/service";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type BackendStatus =
  | "draft"
  | "requested"
  | "accepted"
  | "canceled"
  | "completed"
  | "rated";

type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  options_total: number;
  subtotal: number;
  order_options: Array<{
    id: number;
    option_name: string;
    option_value: string;
    price_delta: number;
  }>;
  product_image?: string;
};

// Update the Order type to match the API response
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
  status: string;
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
  order_number?: string | number;
};

function mapStatus(s?: string) {
  const s2 = String(s || "").toLowerCase();
  const statusMap = {
    requested: {
      label: "Pedido solicitado",
      icon: <Clock className="w-4 h-4" />,
      cls: "bg-sky-50 text-sky-700 border-sky-200",
    },
    draft: {
      label: "Borrador",
      icon: <Wrench className="w-4 h-4" />,
      cls: "bg-gray-50 text-gray-700 border-gray-200",
    },
    accepted: {
      label: "Pedido aceptado",
      icon: <CheckCircle2 className="w-4 h-4" />,
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    canceled: {
      label: "Cancelado",
      icon: <XCircle className="w-4 h-4" />,
      cls: "bg-rose-50 text-rose-700 border-rose-200",
    },
    completed: {
      label: "Completado",
      icon: <BadgeCheck className="w-4 h-4" />,
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    rated: {
      label: "Calificado",
      icon: <Star className="w-4 h-4" />,
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
  };
  return statusMap[s2 as keyof typeof statusMap] || statusMap["requested"];
}

export default function EntrepreneurOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<BackendStatus | null>(null);
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    // Update the fetchOrder function in the useEffect
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          throw new Error("No se proporcionó un ID de pedido");
        }

        console.log("Fetching order with ID:", id);
        const response = await getOrder(String(id));
        console.log("Raw API Response:", response);

        if (!response) {
          throw new Error("No se recibió respuesta del servidor");
        }

        // Handle different response structures
        const responseData = response?.data || response;
        const orderData = responseData?.data || responseData;

        console.log("Processed order data:", orderData);

        if (!orderData) {
          throw new Error("Los datos del pedido están vacíos");
        }

        // Ensure items is an array and provide a default empty array if not present
        const items =
          orderData && orderData.items && Array.isArray(orderData.items)
            ? orderData.items
            : [];

        console.log("Processing items:", items);

        // Process items with proper error handling
        const processedItems = items.map((item: any) => {
          const unitPrice = Number(item?.unit_price || 0);
          const quantity = Number(item?.quantity || 0);
          const optionsTotal = Number(item?.options_total || 0);
          const subtotal = unitPrice * quantity + optionsTotal;

          // Prefer stored product_name, but fall back to related product.name or generic label
          const productName =
            item?.product_name ||
            item?.product?.name ||
            `Producto #${item?.product_id || item?.id || ""}`;

          // Prefer any explicit product_image, then product.image_url if available
          const productImage =
            item?.product_image ||
            item?.product?.image_url ||
            undefined;

          return {
            ...item,
            id: item?.id || 0,
            order_id: item?.order_id || 0,
            product_id: item?.product_id || 0,
            product_name: productName,
            product_image: productImage,
            quantity: quantity,
            unit_price: unitPrice,
            options_total: optionsTotal,
            subtotal: item?.subtotal || subtotal,
            order_options: Array.isArray(item?.order_options)
              ? item.order_options
              : [],
          };
        });

        // Calculate totals if not provided
        const calculatedItemsTotal = processedItems.reduce(
          (sum: number, item: any) => sum + (item.subtotal || 0),
          0 as number
        );

        // Enrich items with fresh product data (name & image) when possible
        let enrichedItems = processedItems;
        try {
          const rawProductIds = processedItems
            .map((it: any) => it.product_id)
            .filter(
              (id: any): id is number => typeof id === "number" && id > 0
            );

          const productIds: number[] = Array.from(new Set<number>(rawProductIds));

          if (productIds.length > 0) {
            const products: Product[] = await getProductsByIds(productIds);
            enrichedItems = processedItems.map((it: any) => {
              const product = products.find((p) => p.id === it.product_id);
              return {
                ...it,
                // Prefer always the current product name from catalog when available
                product_name:
                  product?.name ||
                  it.product_name ||
                  `Producto #${it.product_id || it.id || ""}`,
                product_image: it.product_image || product?.image_url || undefined,
              };
            });
          }
        } catch (e) {
          console.warn("Failed to enrich items with product data", e);
        }

        // Create the final order object with all required fields
        const processedOrder = {
          ...orderData,
          id: orderData.id || 0,
          entrepreneurship_id: orderData.entrepreneurship_id || 0,
          entrepreneurship_name: orderData.entrepreneurship_name || "",
          customer_name: orderData.customer_name || "",
          customer_phone_8: orderData.customer_phone_8 || "",
          customer_email: orderData.customer_email || "",
          status: orderData.status || "draft",
          items_total: Number(orderData.items_total || calculatedItemsTotal),
          options_total: Number(orderData.options_total || 0),
          shipping_total: Number(orderData.shipping_total || 0),
          discount_total: Number(orderData.discount_total || 0),
          grand_total: Number(
            orderData.grand_total ||
              calculatedItemsTotal -
                Number(orderData.discount_total || 0) +
                Number(orderData.shipping_total || 0)
          ),
          currency: orderData.currency || "CRC",
          notes: orderData.notes || null,
          created_at: orderData.created_at || new Date().toISOString(),
          updated_at: orderData.updated_at || new Date().toISOString(),
          items: enrichedItems,
          order_number: orderData.order_number || orderData.id,
          entrepreneurship: orderData.entrepreneurship || {
            id: orderData.entrepreneurship_id,
            name: orderData.entrepreneurship_name,
          },
        };

        console.log("Final processed order:", processedOrder);
        setOrder(processedOrder);
      } catch (error: any) {
        console.error("Error in fetchOrder:", {
          error,
          errorMessage: error?.message || "Unknown error",
          stack: error?.stack,
          response: error?.response?.data || "No response data",
        });
        setError(
          "No se pudo cargar la información del pedido. Por favor, intente nuevamente."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const statusInfo = useMemo(() => mapStatus(order?.status), [order?.status]);

  // Format the created at date
  const formattedDate = useMemo(() => {
    if (!order?.created_at) return "";
    const createdAt = new Date(order.created_at);
    return format(createdAt, "d 'de' MMMM 'de' yyyy 'a las' h:mm a", {
      locale: es,
    });
  }, [order?.created_at]);

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
      <div className="pt-24 pb-8 bg-white dark:bg-backgroundDark min-h-screen">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="mt-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-cardDark rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-24 pb-8 bg-white dark:bg-backgroundDark min-h-screen">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-cardDark border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-200 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <p className="font-medium">No se pudo cargar el pedido</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {error ||
                  "El pedido solicitado no existe o no tienes permiso para verlo."}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Volver atrás
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 bg-gray dark:bg-backgroundDark min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Pedido #{order.order_number || order.id}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.cls}`}
              >
                {statusInfo.icon}
                {statusInfo.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Realizado el {formattedDate}
            </p>
          </div>
          <Link
            to="/entrepreneur/orders"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-cardDark rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-cardDark hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Volver a pedidos
          </Link>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-cardDark shadow overflow-hidden sm:rounded-lg mb-6 border border-gray-100 dark:border-transparent">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-cardDark">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Resumen del pedido
            </h3>
          </div>

          {/* Customer Info */}
          <div className="border-b border-gray-200 dark:border-cardDark px-4 py-5 sm:p-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              INFORMACIÓN DEL CLIENTE
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {order.customer_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer_email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {order.customer_phone_8}
                </p>
              </div>
              {address && (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Dirección de entrega
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">
                    {address}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
              PRODUCTOS
            </h4>
            <div className="space-y-6">
              {order.items?.length > 0 ? (
                order.items.map((item) => {
                  const formOptions =
                    item.order_options && item.order_options.length > 0
                      ? item.order_options
                      : (item as any).options && Array.isArray((item as any).options)
                        ? (item as any).options
                        : [];

                  return (
                    <div
                      key={item.id}
                      className="flex items-start border-b border-gray-100 dark:border-cardDark pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.product_name || `Producto #${item.product_id}`}
                            </h4>

                            {formOptions && formOptions.length > 0 && (
                              <div className="mt-2 bg-gray-50 dark:bg-backgroundDark/50 rounded-md px-3 py-2">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                  Detalles del formulario
                                </p>
                                <dl className="space-y-2">
                                  {formOptions.map((option: OrderItem["order_options"][number]) => (
                                    <div key={option.id} className="text-xs border-l border-gray-200 dark:border-cardDark pl-2">
                                      <dt className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                                        {option.option_name}
                                      </dt>
                                      <dd className="mt-0.5 text-[11px] text-gray-700 dark:text-gray-300 break-words">
                                        <span className="text-gray-800 dark:text-gray-100">{option.option_value}</span>
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
                        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span>Cantidad: {item.quantity}</span>
                          <span className="mx-2">•</span>
                          <span>₡{item.unit_price.toLocaleString()} c/u</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay productos en este pedido
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-backgroundDark/50 px-4 py-5 sm:px-6 border-t border-gray-200 dark:border-cardDark">
            <div className="mt-2 pt-2 flex justify-between text-base font-medium text-gray-900 dark:text-white">
              <span>Total</span>
              <span>
                ₡
                {order.grand_total?.toLocaleString() ||
                  order.items_total?.toLocaleString() ||
                  "0"}
              </span>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-yellow-50 px-4 py-4 sm:px-6 border-t border-yellow-100">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                Notas del pedido
              </h4>
              <p className="text-sm text-yellow-700">{order.notes}</p>
            </div>
          )}

          {/* Order Actions */}
          <div className="px-4 py-4 bg-gray-50 dark:bg-backgroundDark/50 text-right sm:px-6 rounded-b-lg">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              {["requested", "draft"].includes(order.status) && (
                <button
                  onClick={() => doUpdate("accepted")}
                  disabled={!!updating}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand hover:bg-brandDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating === "accepted" ? "Procesando..." : "Aceptar pedido"}
                </button>
              )}

              {["requested", "draft", "accepted"].includes(order.status) && (
                <button
                  onClick={() => doUpdate("canceled")}
                  disabled={!!updating}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating === "canceled"
                    ? "Cancelando..."
                    : "Cancelar pedido"}
                </button>
              )}

              {order.status === "accepted" && (
                <button
                  onClick={() => doUpdate("completed")}
                  disabled={!!updating}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating === "completed"
                    ? "Completando..."
                    : "Marcar como completado"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
