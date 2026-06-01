import { apiClient } from '../client';

export interface Webhook {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  secret: string;
  enabled: boolean;
  events: string[];
  createdAt: string;
}

export interface WebhookLog {
  id: string;
  tenantId?: string;
  source: string;
  event: string;
  payload: any;
  createdAt: string;
}

export interface CreateWebhook extends Omit<Webhook, 'id' | 'tenantId' | 'createdAt'> {}

export const webhooksService = {
  /**
   * Get all webhooks
   */
  getAll: async (): Promise<Webhook[]> => {
    const response = await apiClient.get<{ success: boolean; data: Webhook[] }>('/webhooks');
    return response.data;
  },

  /**
   * Get webhook by ID
   */
  getById: async (id: string): Promise<Webhook> => {
    return apiClient.get<Webhook>(`/webhooks/${id}`);
  },

  /**
   * Create webhook
   */
  create: async (webhook: CreateWebhook): Promise<Webhook> => {
    const response = await apiClient.post<{ success: boolean; data: Webhook }>('/webhooks/register', webhook);
    return response.data;
  },

  /**
   * Update webhook
   */
  update: async (id: string, webhook: Partial<Webhook>): Promise<Webhook> => {
    return apiClient.put<Webhook>(`/webhooks/${id}`, webhook);
  },

  /**
   * Delete webhook
   */
  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/webhooks/${id}`);
  },

  /**
   * Toggle webhook enabled status
   */
  toggle: async (id: string): Promise<Webhook> => {
    return apiClient.patch<Webhook>(`/webhooks/${id}/toggle`);
  },

  /**
   * Test webhook
   */
  test: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/webhooks/${id}/test`);
  },

  /**
   * Send an Inventra-style webhook event (used by Integrations test flow)
   */
  sendInventraEvent: async (event: string, data: Record<string, any>): Promise<{ success: boolean; received: boolean }> => {
    return apiClient.post<{ success: boolean; received: boolean }>('/webhooks/inventra', {
      event,
      data,
    });
  },

  /**
   * Get webhook logs
   */
  getLogs: async (params?: { source?: string; search?: string; limit?: number }): Promise<WebhookLog[]> => {
    const response = await apiClient.get<{ success: boolean; data: WebhookLog[] }>('/webhooks/logs', { params });
    return response.data;
  },

  /**
   * Regenerate webhook secret
   */
  regenerateSecret: async (id: string): Promise<{ secret: string }> => {
    return apiClient.post<{ secret: string }>(`/webhooks/${id}/regenerate-secret`);
  },
};
