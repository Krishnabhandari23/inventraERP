import { apiClient } from '../client';

export interface InventoryItem {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  quantity: number;
  unit: string;
  reorderPoint?: number;
  location?: string;
  cost?: number;
  price?: number;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockItems: {
    id: string;
    sku: string;
    name: string;
    quantity: number;
    reorderPoint: number;
  }[];
}

export const inventoryService = {
  /**
   * Get all inventory items
   */
  getAll: async (params?: { 
    category?: string; 
    search?: string;
    lowStock?: boolean;
  }): Promise<InventoryItem[]> => {
    const response = await apiClient.get<{ success: boolean; data: InventoryItem[] }>('/inventory', { 
      params: params ? { ...params, lowStock: params.lowStock ? 'true' : undefined } : undefined 
    });
    return response.data;
  },

  /**
   * Get inventory item by ID
   */
  getById: async (id: string): Promise<InventoryItem> => {
    const response = await apiClient.get<{ success: boolean; data: InventoryItem }>(`/inventory/${id}`);
    return response.data;
  },

  /**
   * Create new inventory item
   */
  create: async (item: {
    sku: string;
    name: string;
    description?: string;
    category?: string;
    quantity?: number;
    unit?: string;
    reorderPoint?: number;
    location?: string;
    cost?: number;
    price?: number;
    supplier?: string;
  }): Promise<InventoryItem> => {
    const response = await apiClient.post<{ success: boolean; data: InventoryItem }>('/inventory', item);
    return response.data;
  },

  /**
   * Update inventory item
   */
  update: async (id: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await apiClient.put<{ success: boolean; data: InventoryItem }>(`/inventory/${id}`, item);
    return response.data;
  },

  /**
   * Adjust inventory quantity
   */
  adjust: async (id: string, adjustment: number, reason?: string): Promise<InventoryItem> => {
    const response = await apiClient.patch<{ success: boolean; data: InventoryItem }>(`/inventory/${id}/adjust`, { 
      adjustment,
      reason 
    });
    return response.data;
  },

  /**
   * Delete inventory item
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/${id}`);
  },

  /**
   * Get inventory statistics
   */
  getStats: async (): Promise<InventoryStats> => {
    const response = await apiClient.get<{ success: boolean; data: InventoryStats }>('/inventory/stats');
    return response.data;
  },
};
