import { apiClient } from '../client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  tenantName?: string;
  subdomain?: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenantId: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const data = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  /**
   * Register a new user
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const data = await apiClient.post<AuthResponse>('/auth/register', userData);
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
  },

  /**
   * Get current user session
   */
  getCurrentUser: async (): Promise<User> => {
    const data = await apiClient.get<{ success: boolean; user: User }>('/auth/session');
    return data.user;
  },

  /**
   * Refresh auth token
   */
  refreshToken: async (): Promise<{ token: string }> => {
    const data = await apiClient.post<{ token: string }>('/auth/refresh');
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },
};
