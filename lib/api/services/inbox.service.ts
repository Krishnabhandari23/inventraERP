import { apiClient } from '../client';

export type MessageStatus = 'unread' | 'read' | 'archived';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  status: MessageStatus;
  priority: MessagePriority;
  attachments?: string[];
  createdAt: string;
  readAt?: string;
}

export const inboxService = {
  /**
   * Get all messages
   */
  getMessages: async (params?: { status?: MessageStatus; page?: number; limit?: number }): Promise<{ data: Message[]; count: { unread: number; total: number } }> => {
    const response = await apiClient.get<{ success: boolean; data: Message[]; count: { unread: number; total: number } }>('/inbox', { params });
    return { data: response.data, count: response.count };
  },

  /**
   * Get message by ID
   */
  getMessage: async (id: string): Promise<Message> => {
    const response = await apiClient.get<{ success: boolean; data: Message }>(`/inbox/${id}`);
    return response.data;
  },

  /**
   * Send message
   */
  sendMessage: async (message: Omit<Message, 'id' | 'status' | 'createdAt' | 'readAt'>): Promise<Message> => {
    const response = await apiClient.post<{ success: boolean; data: Message }>('/inbox', message);
    return response.data;
  },

  /**
   * Mark message as read
   */
  markAsRead: async (id: string): Promise<Message> => {
    const response = await apiClient.patch<{ success: boolean; data: Message }>(`/inbox/${id}/read`);
    return response.data;
  },

  /**
   * Mark message as unread
   */
  markAsUnread: async (id: string): Promise<Message> => {
    const response = await apiClient.patch<{ success: boolean; data: Message }>(`/inbox/${id}/unread`);
    return response.data;
  },

  /**
   * Archive message
   */
  archiveMessage: async (id: string): Promise<Message> => {
    const response = await apiClient.patch<{ success: boolean; data: Message }>(`/inbox/${id}/archive`);
    return response.data;
  },

  /**
   * Delete message
   */
  deleteMessage: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/inbox/${id}`);
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get<{ success: boolean; count: { unread: number } }>('/inbox/unread-count');
    return response.count;
  },
};
