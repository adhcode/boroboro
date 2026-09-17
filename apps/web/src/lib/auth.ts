import apiClient from './api-client';
import { secureStorage } from './secure-storage';
import { sanitizeInput, isValidEmail } from './security';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Token expiry time (7 days for refresh token)
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;

// Auth API functions with enhanced security
export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    // Sanitize inputs
    const sanitizedData = {
      email: sanitizeInput(data.email.toLowerCase()),
      password: data.password, // Don't sanitize password
      firstName: sanitizeInput(data.firstName),
      lastName: sanitizeInput(data.lastName),
      phone: data.phone ? sanitizeInput(data.phone) : undefined,
    };

    // Validate email
    if (!isValidEmail(sanitizedData.email)) {
      throw new Error('Invalid email address');
    }

    const response = await apiClient.post<AuthResponse>('/auth/register', sanitizedData);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    // Sanitize email only
    const sanitizedData = {
      email: sanitizeInput(data.email.toLowerCase()),
      password: data.password, // Don't sanitize password
    };

    // Validate email
    if (!isValidEmail(sanitizedData.email)) {
      throw new Error('Invalid email address');
    }

    const response = await apiClient.post<AuthResponse>('/auth/login', sanitizedData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = secureStorage.getItem('refreshToken');
    
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local cleanup even if API fails
    } finally {
      // Always clear local storage
      secureStorage.removeItem('accessToken');
      secureStorage.removeItem('refreshToken');
      secureStorage.removeItem('user');
      
      // Clear session data
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
    }
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    
    const userStr = secureStorage.getItem('user');
    if (!userStr) return null;

    try {
      const user = JSON.parse(userStr);
      
      // Validate user object structure
      if (!user.id || !user.email || !user.firstName || !user.lastName) {
        secureStorage.removeItem('user');
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error parsing user data:', error);
      secureStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    const token = secureStorage.getItem('accessToken');
    return !!token;
  },

  setAuthData: (data: AuthResponse): void => {
    // Store tokens with expiry
    secureStorage.setItem('accessToken', data.accessToken);
    secureStorage.setItem('refreshToken', data.refreshToken, REFRESH_TOKEN_EXPIRY);
    secureStorage.setItem('user', JSON.stringify(data.user));
    
    // Set session started time for timeout tracking
    sessionStorage.setItem('sessionStart', Date.now().toString());
  },

  // Check session timeout (30 minutes of inactivity)
  checkSessionTimeout: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const lastActivity = sessionStorage.getItem('lastActivity');
    if (!lastActivity) return false;

    const TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const isTimedOut = Date.now() - parseInt(lastActivity) > TIMEOUT;
    
    if (isTimedOut) {
      authApi.logout();
    }
    
    return isTimedOut;
  },

  // Update last activity timestamp
  updateActivity: (): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lastActivity', Date.now().toString());
    }
  },

  verifyEmail: async (code: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/verify-email', { code });
    return response.data;
  },

  resendVerificationEmail: async (email: string): Promise<{ message: string }> => {
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const response = await apiClient.post<{ message: string }>('/auth/resend-verification', { 
      email: sanitizedEmail 
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { 
      email: sanitizedEmail 
    });
    return response.data;
  },

  resetPassword: async (code: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', { 
      code,
      newPassword 
    });
    return response.data;
  },
};
