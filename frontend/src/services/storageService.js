import { STORAGE_KEYS } from '../utils/constants';

/**
 * Storage service for managing localStorage
 */
const storageService = {
  // Get item from localStorage
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error);
      return null;
    }
  },
  
  // Set item in localStorage
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage:`, error);
      return false;
    }
  },
  
  // Remove item from localStorage
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error);
      return false;
    }
  },
  
  // Clear all items from localStorage
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },
  
  // Token management
  getToken: () => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },
  
  setToken: (token) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },
  
  removeToken: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },
  
  // User management
  getUser: () => {
    return storageService.get(STORAGE_KEYS.USER);
  },
  
  setUser: (user) => {
    return storageService.set(STORAGE_KEYS.USER, user);
  },
  
  removeUser: () => {
    return storageService.remove(STORAGE_KEYS.USER);
  },
  
  // Clear authentication data
  clearAuth: () => {
    storageService.removeToken();
    storageService.removeUser();
  },
};

export default storageService;