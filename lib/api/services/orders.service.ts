import { apiClient } from '../client';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'shipped';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  customerEmail?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrder extends Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> {}

export interface UpdateOrder extends Partial<Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>> {}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  revenue: number;
}

export const ordersService = {
  /**
   * Get all orders
   */
  getAll: async (params?: { 
    status?: OrderStatus; 
    page?: number; 
    limit?: number;
    search?: string;
  }): Promise<{ orders: Order[]; total: number; page: number; limit: number }> => {
    const response = await apiClient.get<{ success: boolean; orders: Order[]; total: number; page: number; limit: number }>('/orders', { params });
    return {
      orders: response.orders || [],
      total: response.total || 0,
      page: response.page || 1,
      limit: response.limit || 50,
    };
  },

  /**
   * Get order by ID
   */
  getById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<{ success: boolean; data: Order }>(`/orders/${id}`);
    return response.data;
  },

  /**
   * Create new order
   */
  create: async (order: CreateOrder): Promise<Order> => {
    const response = await apiClient.post<{ success: boolean; data: Order }>('/orders', order);
    return response.data;
  },

  /**
   * Update order
   */
  update: async (id: string, order: UpdateOrder): Promise<Order> => {
    const response = await apiClient.put<{ success: boolean; data: Order }>(`/orders/${id}`, order);
    return response.data;
  },

  /**
   * Update order status
   */
  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await apiClient.patch<{ success: boolean; data: Order }>(`/orders/${id}/status`, { status });
    return response.data;
  },

  /**
   * Delete order
   */
  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/orders/${id}`);
  },

  /**
   * Get order statistics
   */
  getStats: async (): Promise<OrderStats> => {
    const response = await apiClient.get<{ success: boolean; data: OrderStats }>('/orders/stats/summary');
    return response.data;
  },

  /**
   * Export orders to CSV
   */
  exportCSV: async (params?: { status?: OrderStatus; startDate?: string; endDate?: string }): Promise<Blob> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/orders/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    return response.blob();
  },
};
