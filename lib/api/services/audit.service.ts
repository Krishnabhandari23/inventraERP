import { apiClient } from '../client';

export interface AuditLog {
  id: string;
  tenantId: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: any;
  at: string;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export const auditService = {
  /**
   * Get all audit logs
   */
  getLogs: async (params?: { 
    page?: number; 
    limit?: number; 
    entity?: string;
    action?: string;
    actor?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ logs: AuditLog[]; total: number; page: number; limit: number }> => {
    const response = await apiClient.get<ApiListResponse<AuditLog>>('/audit', { params });
    return {
      logs: response.data,
      total: response.pagination?.total ?? response.data.length,
      page: response.pagination?.page ?? params?.page ?? 1,
      limit: response.pagination?.limit ?? params?.limit ?? response.data.length,
    };
  },

  /**
   * Get audit logs by entity
   */
  getByEntity: async (entity: string, entityId: string): Promise<AuditLog[]> => {
    const response = await apiClient.get<ApiListResponse<AuditLog>>(`/audit/entity/${entityId}`, {
      params: { entity },
    });
    return response.data;
  },

  /**
   * Get audit logs by actor
   */
  getByActor: async (actor: string): Promise<AuditLog[]> => {
    const response = await apiClient.get<ApiListResponse<AuditLog>>('/audit', {
      params: { actor },
    });
    return response.data;
  },

  /**
   * Export audit logs
   */
  exportLogs: async (params?: { startDate?: string; endDate?: string }): Promise<Blob> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/audit/export?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export audit logs');
    }

    return response.blob();
  },
};
