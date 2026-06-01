import { apiClient } from '../client';

export type BillingPlan = 'starter' | 'growth' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export interface Subscription {
  id: string;
  tenantId: string;
  plan: BillingPlan;
  status: SubscriptionStatus;
  stripeId?: string;
  currentPeriodEnd?: string;
}

export interface BillingInvoice {
  id: string;
  number: string;
  amount: number;
  status: string;
  dueDate: string;
  paidAt?: string;
  downloadUrl?: string;
}

export const billingService = {
  /**
   * Get current subscription
   */
  getSubscription: async (): Promise<Subscription> => {
    const response = await apiClient.get<{ success: boolean; data: Subscription }>('/billing/subscription');
    return response.data;
  },

  /**
   * Create checkout session
   */
  createCheckout: async (plan: BillingPlan): Promise<{ url: string }> => {
    const response = await apiClient.post<{ success: boolean; data: { sessionId: string; url: string } }>('/billing/checkout', { plan });
    return response.data;
  },

  /**
   * Create portal session
   */
  createPortal: async (): Promise<{ url: string }> => {
    const response = await apiClient.post<{ success: boolean; data: { url: string } }>('/billing/portal');
    return response.data;
  },

  /**
   * Get invoices
   */
  getInvoices: async (): Promise<BillingInvoice[]> => {
    const response = await apiClient.get<{ success: boolean; data: Array<{
      id: string;
      invoiceNumber: string;
      total: number;
      status: string;
      dueDate: string;
      paidDate?: string;
      paymentMethod?: string;
    }> }>('/sales');

    return response.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.invoiceNumber,
      amount: invoice.total,
      status: invoice.status,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidDate,
      downloadUrl: undefined,
    }));
  },

  /**
   * Update subscription
   */
  updateSubscription: async (plan: BillingPlan): Promise<Subscription> => {
    return apiClient.put<Subscription>('/billing/subscription', { plan });
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>('/billing/subscription');
  },
};
