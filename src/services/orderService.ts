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

export interface OrderTableItem {
  id: number;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  entrepreneurship: {
    id: number;
    name: string;
    logo_url?: string;
  };
  items_count: number;
}

export interface OrdersTableResponse {
  data: OrderTableItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Cliente autenticado: lista mis pedidos
export async function listMyOrders(userId: number): Promise<OrdersTableResponse> {
  try {
    if (!userId) {
      throw new Error('No se pudo obtener el ID de usuario');
    }

    console.log('Fetching orders for user:', userId);
    
    const res = await api.get('/orders', {
      params: {
        user_id: userId
      },
      paramsSerializer: {
        indexes: null // Prevents array indices in query params
      }
    });
    
    console.log('Orders API Response:', res.data);
    
    // Map the response data to match the expected format
    const orders = Array.isArray(res.data) ? res.data : [];
    
    // Map to OrderTableItem format
    const mappedData = orders.map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total: parseFloat(order.total || 0),
      created_at: order.created_at,
      updated_at: order.updated_at,
      entrepreneurship: {
        id: order.entrepreneurship?.id || 0,
        name: order.entrepreneurship?.name || 'Emprendimiento',
        logo_url: order.entrepreneurship?.logo_url
      },
      items_count: order.items?.length || 0
    }));
    
    return {
      data: mappedData,
      current_page: 1,
      last_page: 1,
      per_page: mappedData.length,
      total: mappedData.length
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
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
