import { apiClient } from '../client';

export type IntegrationType = 'stripe' | 'quickbooks' | 'shopify' | 'salesforce' | 'custom';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  config: Record<string, any>;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegration extends Omit<Integration, 'id' | 'status' | 'lastSyncAt' | 'createdAt' | 'updatedAt'> {}

export const integrationsService = {
  /**
   * Get all integrations
   */
  getAll: async (): Promise<Integration[]> => {
    const response = await apiClient.get<{ success: boolean; data: Integration[] }>('/integrations');
    return response.data;
  },

  /**
   * Get integration by ID
   */
  getById: async (id: string): Promise<Integration> => {
    return apiClient.get<Integration>(`/integrations/${id}`);
  },

  /**
   * Create integration
   */
  create: async (integration: CreateIntegration): Promise<Integration> => {
    const response = await apiClient.post<{ success: boolean; data: Integration }>('/integrations/connect', {
      integrationId: integration.type,
      config: integration.config,
    });
    return response.data;
  },

  /**
   * Update integration
   */
  update: async (id: string, integration: Partial<Integration>): Promise<Integration> => {
    return apiClient.put<Integration>(`/integrations/${id}`, integration);
  },

  /**
   * Delete integration
   */
  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/integrations/${id}`);
  },

  /**
   * Test integration connection
   */
  testConnection: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/integrations/${id}/test`);
  },

  /**
   * Sync integration
   */
  sync: async (id: string): Promise<{ success: boolean; syncedAt: string }> => {
    return apiClient.post<{ success: boolean; syncedAt: string }>(`/integrations/${id}/sync`);
  },

  /**
   * Get available integration types
   */
  getAvailableTypes: async (): Promise<{ type: IntegrationType; name: string; description: string }[]> => {
    return [
      { type: 'stripe', name: 'Stripe', description: 'Payment processing and invoicing' },
      { type: 'quickbooks', name: 'QuickBooks', description: 'Sync accounting data with QuickBooks' },
      { type: 'shopify', name: 'Shopify', description: 'Connect your Shopify store for order sync' },
      { type: 'salesforce', name: 'Salesforce', description: 'Sync customer and sales data' },
      { type: 'custom', name: 'Custom', description: 'Connect a custom integration endpoint' },
    ];
  },
};
