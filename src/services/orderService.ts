import { api } from '../lib/api';

export type OrderItemOptionSelection = {
  product_option_id?: number;
  value_id?: number;
};

export type OrderItemCustomField = {
  product_custom_form_id: number;
  value: string | number | boolean;
};

export type CreateOrderItem = {
  product_id: number;
  quantity: number;
  options?: OrderItemOptionSelection[];
  custom_forms?: OrderItemCustomField[];
};

export type CreateOrderPayload = {
  entrepreneurship_id: number | string;
  customer_name: string;
  customer_phone_8: string;
  customer_email: string;
  notes?: string | null;
  shipping_total?: number | null;
  discount_total?: number | null;
  status?: 'draft' | 'requested' | 'accepted' | 'canceled' | 'completed' | 'rated';
};

export async function createOrder(payload: CreateOrderPayload) {
  const res = await api.post('/orders', payload);
  return res.data;
}

export type AddOrderItemOption = {
  product_option_id?: number | null;
  product_option_value_id?: number | null;
  option_name: string;
  option_value?: string | null;
  price_delta: number;
};

export type AddOrderItemPayload = {
  product_id: number;
  quantity: number;
  unit_price: number;
  order_item_options?: AddOrderItemOption[];
};

export async function addOrderItem(orderId: number | string, payload: AddOrderItemPayload) {
  const res = await api.post(`/orders/${orderId}/items`, payload);
  return res.data;
}

export async function updateOrderStatus(orderId: number | string, status: 'draft' | 'requested' | 'accepted' | 'canceled' | 'completed' | 'rated') {
  const res = await api.patch(`/orders/${orderId}/status`, { status });
  return res.data;
}

// Emprendimiento (dueño): lista de pedidos por emprendimiento
export async function listOrdersByEntrepreneurship(
  entrepreneurshipId: number | string,
  opts?: { status?: string | string[]; include?: string; page?: number }
) {
  const params: Record<string, any> = {};
  if (opts?.status) params.status = opts.status;
  if (opts?.include) params.include = opts.include;
  if (opts?.page) params.page = opts.page;
  const res = await api.get(`/entrepreneurships/${entrepreneurshipId}/orders`, { params });
  return res.data;
}

export async function deleteOrder(orderId: number | string) {
  const res = await api.delete(`/orders/${orderId}`);
  return res.data;
}

// Cliente autenticado: lista mis pedidos (el backend infiere user_id del token)
export async function listMyOrders(params?: { status?: string | string[]; page?: number }) {
  const res = await api.get('/orders', { params });
  return res.data;
}

// Ver un pedido (incluye items por defecto)
export async function getOrder(orderId: number | string, includeItems: boolean = true) {
  const res = await api.get(`/orders/${orderId}`, { params: { include_items: includeItems } });
  return res.data;
}

// Dataset para la tabla del emprendedor
export async function listOrdersTable(
  entrepreneurshipId: number | string,
  opts?: { status?: string | string[]; page?: number }
) {
  const params: Record<string, any> = { entrepreneurship_id: entrepreneurshipId };
  if (opts?.status) params.status = opts.status;
  if (opts?.page) params.page = opts.page;
  const res = await api.get('/orders-table', { params });
  return res.data;
}
