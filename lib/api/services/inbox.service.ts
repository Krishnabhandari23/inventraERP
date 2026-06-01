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
  getMessages: async (params?: { status?: MessageStatus; page?: number; limit?: number }): Promise<Message[]> => {
    return apiClient.get<Message[]>('/inbox/messages', { params });
  },

  /**
   * Get message by ID
   */
  getMessage: async (id: string): Promise<Message> => {
    return apiClient.get<Message>(`/inbox/messages/${id}`);
  },

  /**
   * Send message
   */
  sendMessage: async (message: Omit<Message, 'id' | 'status' | 'createdAt' | 'readAt'>): Promise<Message> => {
    return apiClient.post<Message>('/inbox/messages', message);
  },

  /**
   * Mark message as read
   */
  markAsRead: async (id: string): Promise<Message> => {
    return apiClient.patch<Message>(`/inbox/messages/${id}/read`);
  },

  /**
   * Mark message as unread
   */
  markAsUnread: async (id: string): Promise<Message> => {
    return apiClient.patch<Message>(`/inbox/messages/${id}/unread`);
  },

  /**
   * Archive message
   */
  archiveMessage: async (id: string): Promise<Message> => {
    return apiClient.patch<Message>(`/inbox/messages/${id}/archive`);
  },

  /**
   * Delete message
   */
  deleteMessage: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/inbox/messages/${id}`);
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiClient.get<{ count: number }>('/inbox/unread-count');
  },
};
