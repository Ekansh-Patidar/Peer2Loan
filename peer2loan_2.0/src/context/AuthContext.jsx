import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import storageService from '../services/storageService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = storageService.getToken();
      const storedUser = storageService.getUser();

      if (token && storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        
        // Optionally fetch fresh user data
        try {
          await authService.getProfile();
        } catch (error) {
          // If token is invalid, logout
          console.error('Auth initialization error:', error);
          logout();
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Register
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Login
  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      setUser(response.data.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};