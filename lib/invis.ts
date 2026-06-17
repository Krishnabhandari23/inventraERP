import { apiClient } from '@/lib/api/client';
import { InvisReply } from './types';

export async function sendToInvis(message: string): Promise<InvisReply[]> {
  const result = await apiClient.post<{ success: boolean; replies: InvisReply[]; message?: string }>('/invis', {
    message,
  });

  if (!result.success) {
    throw new Error(result.message || 'Invis request failed');
  }

  return result.replies;
}

export async function getInvisCapabilities() {
  const result = await apiClient.get<{ success: boolean; capabilities: any[] }>('/invis/capabilities');
  if (!result.success) {
    throw new Error('Failed to load Invis capabilities');
  }
  return result.capabilities;
}
