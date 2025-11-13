import api from './api';

/**
 * Payment Service - All payment-related API calls
 */
const paymentService = {
  /**
   * Record a new payment
   * @param {FormData} paymentData - Payment data with optional file
   * @returns {Promise<Object>} Created payment
   */
  recordPayment: async (paymentData) => {
    try {
      // If paymentData is FormData (file upload), send as multipart
      const config = paymentData instanceof FormData ? {
        headers: { 'Content-Type': 'multipart/form-data' }
      } : {};
      
      const response = await api.post('/payments', paymentData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment details
   */
  getPaymentById: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all payments for a cycle
   * @param {string} cycleId - Cycle ID
   * @returns {Promise<Object>} List of payments
   */
  getCyclePayments: async (cycleId) => {
    try {
      const response = await api.get(`/payments/cycle/${cycleId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get payment history for a member
   * @param {string} memberId - Member ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} Payment history
   */
  getMemberPayments: async (memberId, params = {}) => {
    try {
      const response = await api.get(`/payments/member/${memberId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all payments for a group
   * @param {string} groupId - Group ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Group payments
   */
  getGroupPayments: async (groupId, params = {}) => {
    try {
      const response = await api.get(`/payments/group/${groupId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Confirm payment (Admin only)
   * @param {string} paymentId - Payment ID
   * @param {Object} data - Confirmation data
   * @returns {Promise<Object>} Updated payment
   */
  confirmPayment: async (paymentId, data = {}) => {
    try {
      const response = await api.put(`/payments/${paymentId}/confirm`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Reject payment (Admin only)
   * @param {string} paymentId - Payment ID
   * @param {Object} data - Rejection reason
   * @returns {Promise<Object>} Updated payment
   */
  rejectPayment: async (paymentId, data = {}) => {
    try {
      const response = await api.put(`/payments/${paymentId}/reject`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Mark payment as late (Admin only)
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Updated payment
   */
  markPaymentLate: async (paymentId) => {
    try {
      const response = await api.put(`/payments/${paymentId}/mark-late`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update payment
   * @param {string} paymentId - Payment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated payment
   */
  updatePayment: async (paymentId, updateData) => {
    try {
      const response = await api.put(`/payments/${paymentId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete payment
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  deletePayment: async (paymentId) => {
    try {
      const response = await api.delete(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Download payment proof
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Blob>} File blob
   */
  downloadPaymentProof: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}/proof`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get payment statistics
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} Payment statistics
   */
  getPaymentStats: async (groupId) => {
    try {
      const response = await api.get(`/payments/stats/${groupId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default paymentService;