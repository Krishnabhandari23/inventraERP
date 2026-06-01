import { apiClient } from '../client';

export type ProductionStatus = 'planned' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';

export interface ProductionJob {
  id: string;
  jobNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  status: ProductionStatus;
  startDate: string;
  endDate?: string;
  assignedTo?: string;
  materials: {
    id: string;
    name: string;
    quantity: number;
    allocated: boolean;
  }[];
  progress: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductionJob extends Omit<ProductionJob, 'id' | 'jobNumber' | 'progress' | 'createdAt' | 'updatedAt'> {}

export interface ProductionSchedule {
  date: string;
  jobs: ProductionJob[];
  capacity: number;
  utilized: number;
}

export const productionService = {
  /**
   * Get all production jobs
   */
  getJobs: async (params?: { 
    status?: ProductionStatus; 
    startDate?: string; 
    endDate?: string 
  }): Promise<ProductionJob[]> => {
    const response = await apiClient.get<{ success: boolean; data: ProductionJob[] }>('/production/jobs', { params });
    return response.data || [];
  },

  /**
   * Get production job by ID
   */
  getJobById: async (id: string): Promise<ProductionJob> => {
    const response = await apiClient.get<{ success: boolean; data: ProductionJob }>(`/production/jobs/${id}`);
    return response.data;
  },

  /**
   * Create new production job
   */
  createJob: async (job: CreateProductionJob): Promise<ProductionJob> => {
    const response = await apiClient.post<{ success: boolean; data: ProductionJob }>('/production/jobs', job);
    return response.data;
  },

  /**
   * Update production job
   */
  updateJob: async (id: string, job: Partial<ProductionJob>): Promise<ProductionJob> => {
    const response = await apiClient.put<{ success: boolean; data: ProductionJob }>(`/production/jobs/${id}`, job);
    return response.data;
  },

  /**
   * Update job status
   */
  updateJobStatus: async (id: string, status: ProductionStatus): Promise<ProductionJob> => {
    const response = await apiClient.patch<{ success: boolean; data: ProductionJob }>(`/production/jobs/${id}/status`, { status });
    return response.data;
  },

  /**
   * Update job progress
   */
  updateJobProgress: async (id: string, progress: number): Promise<ProductionJob> => {
    const response = await apiClient.patch<{ success: boolean; data: ProductionJob }>(`/production/jobs/${id}/progress`, { progress });
    return response.data;
  },

  /**
   * Get production schedule
   */
  getSchedule: async (params?: { startDate?: string; endDate?: string }): Promise<ProductionSchedule[]> => {
    const response = await apiClient.get<{ success: boolean; data: ProductionSchedule[] }>('/production/schedule', { params });
    return response.data || [];
  },

  /**
   * Delete production job
   */
  deleteJob: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/production/jobs/${id}`);
  },
};
