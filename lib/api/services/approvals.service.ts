import { apiClient } from '../client';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalType = 'order' | 'purchase' | 'production' | 'expense' | 'other';

export interface Approval {
  id: string;
  type: ApprovalType;
  entityId: string;
  entityName: string;
  requestedBy: string;
  status: ApprovalStatus;
  amount?: number;
  reason?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApproval extends Omit<Approval, 'id' | 'status' | 'approvedBy' | 'approvedAt' | 'rejectedBy' | 'rejectedAt' | 'rejectionReason' | 'createdAt' | 'updatedAt'> {}

export const approvalsService = {
  /**
   * Get all approvals
   */
  getAll: async (params?: { status?: ApprovalStatus; type?: ApprovalType }): Promise<Approval[]> => {
    const response = await apiClient.get<{ success: boolean; data: Approval[] }>('/approvals', { params });
    return response.data;
  },

  /**
   * Get pending approvals
   */
  getPending: async (): Promise<Approval[]> => {
    const response = await apiClient.get<{ success: boolean; data: Approval[] }>('/approvals/pending/my');
    return response.data;
  },

  /**
   * Get approval by ID
   */
  getById: async (id: string): Promise<Approval> => {
    const response = await apiClient.get<{ success: boolean; data: Approval }>(`/approvals/${id}`);
    return response.data;
  },

  /**
   * Create approval request
   */
  create: async (approval: CreateApproval): Promise<Approval> => {
    const response = await apiClient.post<{ success: boolean; data: Approval }>('/approvals', approval);
    return response.data;
  },

  /**
   * Approve an approval request
   */
  approve: async (id: string, notes?: string): Promise<Approval> => {
    const response = await apiClient.patch<{ success: boolean; data: Approval }>(`/approvals/${id}/approve`, { comments: notes });
    return response.data;
  },

  /**
   * Reject an approval request
   */
  reject: async (id: string, reason: string): Promise<Approval> => {
    const response = await apiClient.patch<{ success: boolean; data: Approval }>(`/approvals/${id}/reject`, { reason });
    return response.data;
  },

  /**
   * Get approvals by user
   */
  getByUser: async (userId: string): Promise<Approval[]> => {
    const response = await apiClient.get<{ success: boolean; data: Approval[] }>(`/approvals?userId=${encodeURIComponent(userId)}`);
    return response.data;
  },
};
