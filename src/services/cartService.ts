import { api } from '../lib/api';

export interface OrderItemRequest {
  product_id: number;
  quantity: number;
  unit_price: number;
  options?: Array<{
    option_id: number;
    value_ids: number[];
  }>;
  custom_fields?: Array<{
    form_id: number;
    value: string | number | boolean;
  }>;
}

export interface CreateOrderRequest {
  entrepreneurship_id: number;
  customer_name: string;
  customer_phone_8: string;
  customer_email: string;
  user_id: number;  // Added user_id as required field
  status: 'draft' | 'requested' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
  shipping_total?: number;
  discount_total?: number;
}

export interface AddOrderItemRequest {
  product_id: number;
  quantity: number;
  unit_price: number;
  order_item_options?: Array<{
    product_option_id?: number;
    product_option_value_id?: number;
    option_name: string;
    option_value?: string;
    price_delta: number;
  }>;
}

export interface UpdateOrderStatusRequest {
  status: 'requested' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
}

export interface OrderResponse {
  id: number;
  entrepreneurship_id: number;
  user_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: string;
  items_total: number;
  options_total: number;
  shipping_total: number;
  discount_total: number;
  grand_total: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    options: Array<{
      id: number;
      name: string;
      values: Array<{
        id: number;
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

export const cartApi = {
  // Step 1: Create the order
  async createDraftOrder(orderData: Omit<CreateOrderRequest, 'status' | 'user_id'>, userId: number): Promise<OrderResponse> {
    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      
      // Validate the provided userId
      if (!userId) {
        console.error('No se proporcionó un ID de usuario válido');
        throw new Error('No se pudo obtener el ID de usuario. Por favor, inicie sesión nuevamente.');
      }
      
      console.log('Creating draft order with data:', {
        ...orderData,
        user_id: userId,
        status: 'draft',
        shipping_total: orderData.shipping_total || 0,
        discount_total: orderData.discount_total || 0,
      });
      
      const payload = {
        ...orderData,
        user_id: userId,
        status: 'draft' as const,
        shipping_total: orderData.shipping_total || 0,
        discount_total: orderData.discount_total || 0,
      };
      
      console.log('Sending order payload:', payload);
      const response = await api.post('orders', payload);
      
      console.log('Draft order response:', response);
      
      // Handle nested response structure
      const responseData = response.data?.data || response.data;
      
      if (!responseData) {
        console.error('Empty response data:', response);
        throw new Error('No se recibieron datos en la respuesta del servidor');
      }
      
      if (!responseData.id) {
        console.error('Missing order ID in response:', responseData);
        throw new Error('No se pudo crear la orden: ID de orden no recibido');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error creating draft order:', {
        error,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      // If the server returns a response with an error message, use it
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw error;
    }
  },

  // Step 2: Add items to the order
  async addOrderItem(orderId: number, itemData: AddOrderItemRequest): Promise<any> {
    try {
      console.log(`Adding item to order ${orderId}:`, itemData);
      const response = await api.post(`orders/${orderId}/items`, itemData);
      
      // Handle nested response structure
      const responseData = response.data?.data || response.data;
      console.log('Add item response:', responseData);
      
      if (!responseData) {
        throw new Error('No se recibieron datos en la respuesta del servidor');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error adding item to order:', {
        error,
        response: error.response?.data,
        status: error.response?.status,
        orderId,
        itemData
      });
      
      if (error.response?.data?.message) {
        throw new Error(`Error al agregar ítem: ${error.response.data.message}`);
      }
      
      throw new Error('Error al agregar ítem al pedido');
    }
  },

  // Step 3: Update order status (e.g., to 'requested')
  async updateOrderStatus(orderId: number, status: UpdateOrderStatusRequest['status']): Promise<OrderResponse> {
    try {
      console.log(`Updating order ${orderId} status to:`, status);
      const response = await api.patch(`orders/${orderId}/status`, { status });
      
      // Handle nested response structure
      const responseData = response.data?.data || response.data;
      console.log('Update status response:', responseData);
      
      if (!responseData) {
        throw new Error('No se recibieron datos en la respuesta del servidor');
      }
      
      if (!responseData.id) {
        console.error('Missing order ID in response:', responseData);
        throw new Error('No se pudo actualizar el estado: ID de orden no recibido');
      }
      
      return responseData;
    } catch (error: any) {
      console.error('Error updating order status:', {
        error,
        response: error.response?.data,
        status: error.response?.status,
        orderId,
        newStatus: status
      });
      
      if (error.response?.data?.message) {
        throw new Error(`Error al actualizar estado: ${error.response.data.message}`);
      }
      
      throw new Error('Error al actualizar el estado del pedido');
    }
  },

  async getOrder(orderId: number): Promise<OrderResponse> {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  },

  async cancelOrder(orderId: number): Promise<void> {
    try {
      await api.put(`/orders/${orderId}/cancel`);
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error);
      throw error;
    }
  },

  async getOrderStatus(orderId: number): Promise<{ status: string }> {
    try {
      const response = await api.get(`/orders/${orderId}/status`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching status for order ${orderId}:`, error);
      throw error;
    }
  },

  async getOrderHistory(params?: {
    page?: number;
    per_page?: number;
    status?: string;
  }): Promise<{
    data: OrderResponse[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  },
};
