import { apiService } from './api';
import storageService from './storageService';

/**
 * Authentication service
 */
const authService = {
  /**
   * Register new user
   */
  register: async (userData) => {
    try {
      const response = await apiService.post('/auth/register', userData);
      
      if (response.data.token) {
        storageService.setToken(response.data.token);
        storageService.setUser(response.data.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Login user
   */
  login: async (credentials) => {
    try {
      const response = await apiService.post('/auth/login', credentials);
      
      if (response.data.token) {
        storageService.setToken(response.data.token);
        storageService.setUser(response.data.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Logout user
   */
  logout: async () => {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Even if API call fails, clear local storage
      console.error('Logout error:', error);
    } finally {
      storageService.clearAuth();
    }
  },
  
  /**
   * Get current user profile
   */
  getProfile: async () => {
    try {
      const response = await apiService.get('/auth/me');
      
      if (response.data.user) {
        storageService.setUser(response.data.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    try {
      const response = await apiService.put('/auth/profile', profileData);
      
      if (response.data.user) {
        storageService.setUser(response.data.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Change password
   */
  changePassword: async (passwordData) => {
    try {
      const response = await apiService.put('/auth/change-password', passwordData);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    const token = storageService.getToken();
    return !!token;
  },
  
  /**
   * Get current user from storage
   */
  getCurrentUser: () => {
    return storageService.getUser();
  },
};

export default authService;