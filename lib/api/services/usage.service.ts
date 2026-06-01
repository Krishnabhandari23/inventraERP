import { apiClient } from '../client';

export interface UsageEvent {
  id: string;
  tenantId: string;
  kind: string;
  amount: number;
  at: string;
}

export interface UsageStats {
  events: {
    kind: string;
    count: number;
    total: number;
  }[];
  summary: Record<string, { count: number; total: number }>;
  totalEvents: number;
}

type UsageReportResponse = {
  success: boolean;
  data: UsageStats;
};

export const usageService = {
  /**
   * Get usage events
   */
  getEvents: async (params?: { 
    startDate?: string; 
    endDate?: string; 
    kind?: string 
  }): Promise<UsageEvent[]> => {
    const response = await apiClient.get<UsageReportResponse>('/usage/report', { params });
    return response.data.events as unknown as UsageEvent[];
  },

  /**
   * Get usage statistics
   */
  getStats: async (params?: { startDate?: string; endDate?: string }): Promise<UsageStats> => {
    const response = await apiClient.get<UsageReportResponse>('/usage/report', { params });
    return response.data;
  },

  /**
   * Record usage event
   */
  recordEvent: async (kind: string, amount: number = 1): Promise<UsageEvent> => {
    return apiClient.post<UsageEvent>('/usage/track', { kind, amount });
  },
};
