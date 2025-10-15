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

export async function listOrdersByEntrepreneurship(entrepreneurshipId: number | string, page?: number) {
  const res = await api.get('/orders', { params: { entrepreneurship_id: entrepreneurshipId, page } });
  return res.data;
}

export async function deleteOrder(orderId: number | string, params?: Record<string, any>) {
  const res = await api.delete(`/orders/${orderId}`, { params });
  return res.data;
}

export async function listMyOrders(params?: Record<string, any>) {
  const res = await api.get('/orders', { params });
  return res.data;
}
