import api from './api';

/**
 * Payout Service - All payout-related API calls
 */
const payoutService = {
  /**
   * Execute a payout
   */
  executePayout: async (payoutData) => {
    try {
      const config = payoutData instanceof FormData ? {
        headers: { 'Content-Type': 'multipart/form-data' }
      } : {};
      
      const response = await api.post('/payouts', payoutData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get payout by ID
   */
  getPayoutById: async (payoutId) => {
    try {
      const response = await api.get(`/payouts/${payoutId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all payouts for a group
   */
  getGroupPayouts: async (groupId, params = {}) => {
    try {
      const response = await api.get(`/payouts/group/${groupId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get payouts for a member
   */
  getMemberPayouts: async (memberId) => {
    try {
      const response = await api.get(`/payouts/member/${memberId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get payouts for a cycle
   */
  getCyclePayout: async (cycleId) => {
    try {
      const response = await api.get(`/payouts/cycle/${cycleId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Complete payout (mark as completed)
   */
  completePayout: async (payoutId, data = {}) => {
    try {
      const response = await api.put(`/payouts/${payoutId}/complete`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cancel payout
   */
  cancelPayout: async (payoutId, reason) => {
    try {
      const response = await api.put(`/payouts/${payoutId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update payout
   */
  updatePayout: async (payoutId, updateData) => {
    try {
      const response = await api.put(`/payouts/${payoutId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete payout
   */
  deletePayout: async (payoutId) => {
    try {
      const response = await api.delete(`/payouts/${payoutId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Download payout proof
   */
  downloadPayoutProof: async (payoutId) => {
    try {
      const response = await api.get(`/payouts/${payoutId}/proof`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get payout statistics
   */
  getPayoutStats: async (groupId) => {
    try {
      const response = await api.get(`/payouts/stats/${groupId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default payoutService;