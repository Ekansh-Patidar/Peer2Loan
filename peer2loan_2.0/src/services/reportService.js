import { apiService } from './api';

/**
 * Report service - Handles all report-related API calls
 */
const reportService = {
  /**
   * Get group ledger (all transactions)
   * @param {string} groupId - Group ID
   */
  getGroupLedger: async (groupId) => {
    try {
      const response = await apiService.get(`/reports/group/${groupId}/ledger`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get monthly summary for a specific cycle
   * @param {string} groupId - Group ID
   * @param {number} cycleNumber - Cycle number
   */
  getMonthlySummary: async (groupId, cycleNumber) => {
    try {
      const response = await apiService.get(`/reports/group/${groupId}/monthly/${cycleNumber}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get member ledger (member's transaction history)
   * @param {string} memberId - Member ID
   */
  getMemberLedger: async (memberId) => {
    try {
      const response = await apiService.get(`/reports/member/${memberId}/ledger`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get audit log for a group
   * @param {string} groupId - Group ID
   * @param {object} params - Query parameters (page, limit)
   */
  getAuditLog: async (groupId, params = {}) => {
    try {
      const response = await apiService.get(`/reports/group/${groupId}/audit-log`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Export group report as CSV
   * @param {string} groupId - Group ID
   */
  exportGroupCSV: async (groupId) => {
    try {
      await apiService.download(
        `/reports/group/${groupId}/export/csv`,
        `group-${groupId}-report.csv`
      );
    } catch (error) {
      throw error;
    }
  },

  /**
   * Export group report as PDF
   * @param {string} groupId - Group ID
   */
  exportGroupPDF: async (groupId) => {
    try {
      await apiService.download(
        `/reports/group/${groupId}/export/pdf`,
        `group-${groupId}-report.pdf`
      );
    } catch (error) {
      throw error;
    }
  },
};

export default reportService;
