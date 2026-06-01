import { apiClient } from '../client';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  customer: string;
  customerEmail?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueStats {
  totalRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

export interface TopCustomer {
  customer: string;
  total: number;
}

export const salesService = {
  /**
   * Get all invoices
   */
  getInvoices: async (params?: { 
    status?: string; 
    customer?: string;
    startDate?: string; 
    endDate?: string;
  }): Promise<Invoice[]> => {
    const response = await apiClient.get<{ success: boolean; data: Invoice[] }>('/sales', { params });
    return response.data;
  },

  /**
   * Get invoice by ID
   */
  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<{ success: boolean; data: Invoice }>(`/sales/${id}`);
    return response.data;
  },

  /**
   * Create new invoice
   */
  createInvoice: async (invoice: {
    customer: string;
    customerEmail?: string;
    items: InvoiceItem[];
    subtotal: number;
    tax?: number;
    total: number;
    dueDate?: string;
    paymentMethod?: string;
    notes?: string;
  }): Promise<Invoice> => {
    const response = await apiClient.post<{ success: boolean; data: Invoice }>('/sales', invoice);
    return response.data;
  },

  /**
   * Update invoice
   */
  updateInvoice: async (id: string, invoice: Partial<Invoice>): Promise<Invoice> => {
    const response = await apiClient.put<{ success: boolean; data: Invoice }>(`/sales/${id}`, invoice);
    return response.data;
  },

  /**
   * Update invoice status
   */
  updateInvoiceStatus: async (id: string, status: string, paidDate?: string): Promise<Invoice> => {
    const response = await apiClient.patch<{ success: boolean; data: Invoice }>(`/sales/${id}/status`, { 
      status, 
      paidDate 
    });
    return response.data;
  },

  /**
   * Delete invoice
   */
  deleteInvoice: async (id: string): Promise<void> => {
    await apiClient.delete(`/sales/${id}`);
  },

  /**
   * Get revenue statistics
   */
  getRevenueStats: async (): Promise<RevenueStats> => {
    const response = await apiClient.get<{ success: boolean; data: RevenueStats }>('/sales/stats/revenue');
    return response.data;
  },

  /**
   * Get top customers
   */
  getTopCustomers: async (limit?: number): Promise<TopCustomer[]> => {
    const response = await apiClient.get<{ success: boolean; data: TopCustomer[] }>('/sales/stats/top-customers', {
      params: { limit },
    });
    return response.data;
  },
};
