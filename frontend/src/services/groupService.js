// src/services/groupService.js
import api from './api';

/**
 * Group Service - All group-related API calls
 * Member 2: Group Management Specialist
 */

const groupService = {
  /**
   * Create a new group
   * @param {Object} groupData - Group creation data
   * @returns {Promise<Object>} Created group
   */
  createGroup: async (groupData) => {
    try {
      const response = await api.post('/groups', groupData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all groups for current user
   * @param {Object} params - Query parameters (page, limit, status)
   * @returns {Promise<Object>} List of groups with pagination
   */
  getMyGroups: async (params = {}) => {
    try {
      const response = await api.get('/groups', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get group by ID
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} Group details
   */
  getGroupById: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update group details
   * @param {string} groupId - Group ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated group
   */
  updateGroup: async (groupId, updateData) => {
    try {
      const response = await api.put(`/groups/${groupId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete group
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} Delete confirmation
   */
  deleteGroup: async (groupId) => {
    try {
      const response = await api.delete(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Invite member to group
   * @param {string} groupId - Group ID
   * @param {Object} inviteData - { email, turnNumber }
   * @returns {Promise<Object>} Invitation details
   */
  inviteMember: async (groupId, inviteData) => {
    try {
      const response = await api.post(`/groups/${groupId}/invite`, inviteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Accept group invitation
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} Acceptance confirmation
   */
  acceptInvitation: async (groupId) => {
    try {
      const response = await api.post(`/groups/${groupId}/accept`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Reject group invitation
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} Rejection confirmation
   */
  rejectInvitation: async (groupId) => {
    try {
      const response = await api.post(`/groups/${groupId}/reject`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Activate group (start cycles)
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} Activation confirmation
   */
  activateGroup: async (groupId) => {
    try {
      const response = await api.post(`/groups/${groupId}/activate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get group members
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} List of members
   */
  getGroupMembers: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Remove member from group
   * @param {string} groupId - Group ID
   * @param {string} memberId - Member ID
   * @returns {Promise<Object>} Removal confirmation
   */
  removeMember: async (groupId, memberId) => {
    try {
      const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update member details
   * @param {string} groupId - Group ID
   * @param {string} memberId - Member ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated member
   */
  updateMember: async (groupId, memberId, updateData) => {
    try {
      const response = await api.put(`/groups/${groupId}/members/${memberId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get group statistics
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} Group statistics
   */
  getGroupStats: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get group cycles
   * @param {string} groupId - Group ID
   * @returns {Promise<Object>} List of cycles
   */
  getGroupCycles: async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/cycles`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update turn order
   * @param {string} groupId - Group ID
   * @param {Array} turnOrder - New turn order array
   * @returns {Promise<Object>} Updated turn order
   */
  updateTurnOrder: async (groupId, turnOrder) => {
    try {
      const response = await api.put(`/groups/${groupId}/turn-order`, { turnOrder });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Resend invitation email
   * @param {string} groupId - Group ID
   * @param {string} memberId - Member ID
   * @returns {Promise<Object>} Resend confirmation
   */
  resendInvitation: async (groupId, memberId) => {
    try {
      const response = await api.post(`/groups/${groupId}/members/${memberId}/resend-invite`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default groupService;