import { apiService } from './api';

/**
 * Dashboard service - Handles all dashboard-related API calls
 */
const dashboardService = {
  /**
   * Get group dashboard (Admin/Organizer view)
   * @param {string} groupId - Group ID
   */
  getGroupDashboard: async (groupId) => {
    try {
      const response = await apiService.get(`/dashboard/group/${groupId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get member dashboard (Member view)
   * @param {string} groupId - Group ID
   */
  getMemberDashboard: async (groupId) => {
    try {
      const response = await apiService.get(`/dashboard/member/${groupId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get overview dashboard (All groups)
   */
  getOverviewDashboard: async () => {
    try {
      const response = await apiService.get('/dashboard/overview');
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get group statistics
   * @param {string} groupId - Group ID
   */
  getGroupStats: async (groupId) => {
    try {
      const response = await apiService.get(`/dashboard/group/${groupId}/stats`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default dashboardService;
