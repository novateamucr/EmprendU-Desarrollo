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
  user_id?: number;  // Make it optional for backward compatibility
  notes?: string | null;
  shipping_total?: number | null;
  discount_total?: number | null;
  status?: 'draft' | 'requested' | 'accepted' | 'canceled' | 'completed' | 'rated';
};

export async function createOrder(payload: CreateOrderPayload) {
  // Get the auth token from localStorage
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }
  
  // Decode the token to get user info (assuming it's a JWT)
  // Note: This is a simplified example - you might need to adjust based on your token format
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    throw new Error('Token inválido');
  }
  
  try {
    const decoded = JSON.parse(atob(tokenParts[1]));
    const userId = decoded?.user_id || decoded?.sub;
    
    if (!userId) {
      throw new Error('No se pudo obtener el ID de usuario del token');
    }
    
    // Create the request payload with the user_id
    const requestPayload = {
      ...payload,
      user_id: userId
    };
    
    console.log('Creating order with payload:', requestPayload);
    
    const res = await api.post('/orders', requestPayload);
    return res.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Error al crear la orden. Por favor, intente de nuevo.');
  }
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
      throw new Error('User ID is required');
    }

    console.log('Fetching orders for user ID:', userId);
    
    // Using the orders endpoint with user_id parameter
    const res = await api.get('/orders', {
      params: {
        user_id: userId
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Orders API Response:', res.data);
    
    // Map the response data to match the expected format
    const orders = Array.isArray(res.data) ? res.data : [];
    
    // Map to OrderTableItem format
    const mappedData = orders.map((order: any) => ({
      id: order.id,
      order_number: order.id,
      status: order.status,
      total: parseFloat(order.grand_total || 0),
      created_at: order.created_at,
      updated_at: order.updated_at,
      entrepreneurship: {
        id: order.entrepreneurship?.id || 0,
        name: order.entrepreneurship?.name || 'Emprendimiento',
        logo_url: order.entrepreneurship?.image_url
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
export async function getOrder(orderId: number | string) {
  const res = await api.get(`/orders/${orderId}`, {
    params: {
      include: 'items,items.product,items.options,items.options.option,items.options.option_value,entrepreneurship,customer'
    }
  });
  return res.data;
}

export async function cancelOrder(orderId: number | string) {
  return api.patch(`/orders/${orderId}/status`, {
    status: 'canceled'
  });
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
