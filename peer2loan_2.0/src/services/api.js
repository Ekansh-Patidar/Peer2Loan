import axios from 'axios';
import { API_URL, API_TIMEOUT, STORAGE_KEYS } from '../utils/constants';

// Debug: Log API URL
console.log('API Configuration:', {
  API_URL,
  API_TIMEOUT,
  env: import.meta.env.VITE_API_URL
});

/**
 * Create axios instance
 */
const api = axios.create({
  baseURL: API_URL || 'http://localhost:5000/api/v1',
  timeout: API_TIMEOUT || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors
 */
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      
      // Unauthorized - Clear token and redirect to login
      if (status === 401) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = '/login';
      }
      
      // Return formatted error
      return Promise.reject({
        status,
        message: data.message || 'An error occurred',
        errors: data.errors || [],
      });
    }
    
    // Network error
    if (error.request) {
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
        errors: [],
      });
    }
    
    // Other errors
    return Promise.reject({
      status: 0,
      message: error.message || 'An unexpected error occurred',
      errors: [],
    });
  }
);

/**
 * API methods
 */
export const apiService = {
  // GET request
  get: (url, config = {}) => {
    return api.get(url, config);
  },
  
  // POST request
  post: (url, data = {}, config = {}) => {
    return api.post(url, data, config);
  },
  
  // PUT request
  put: (url, data = {}, config = {}) => {
    return api.put(url, data, config);
  },
  
  // DELETE request
  delete: (url, config = {}) => {
    return api.delete(url, config);
  },
  
  // PATCH request
  patch: (url, data = {}, config = {}) => {
    return api.patch(url, data, config);
  },
  
  // Upload file (multipart/form-data)
  upload: (url, formData, onUploadProgress) => {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  
  // Download file
  download: (url, filename) => {
    return api.get(url, {
      responseType: 'blob',
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  },
};

export default api;