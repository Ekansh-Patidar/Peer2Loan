import api from './api';

export const groupService = {
  // CRUD Operations
  createGroup: async (groupData) => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  getAllGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  getGroupById: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  updateGroup: async (groupId, updates) => {
    const response = await api.put(`/groups/${groupId}`, updates);
    return response.data;
  },

  deleteGroup: async (groupId) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  },

  // Member Operations
  addMember: async (groupId, userId) => {
    const response = await api.post(`/groups/${groupId}/members`, { userId });
    return response.data;
  },

  removeMember: async (groupId, userId) => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  },

  updateMemberRole: async (groupId, userId, role) => {
    const response = await api.patch(`/groups/${groupId}/members/${userId}`, { role });
    return response.data;
  },

  // Invitation Operations
  sendInvitation: async (groupId, email) => {
    const response = await api.post(`/groups/${groupId}/invitations`, { email });
    return response.data;
  },

  getInvitations: async (groupId) => {
    const response = await api.get(`/groups/${groupId}/invitations`);
    return response.data;
  },

  acceptInvitation: async (invitationId) => {
    const response = await api.post(`/invitations/${invitationId}/accept`);
    return response.data;
  },

  rejectInvitation: async (invitationId) => {
    const response = await api.post(`/invitations/${invitationId}/reject`);
    return response.data;
  },

  // Turn Order
  getTurnOrder: async (groupId) => {
    const response = await api.get(`/groups/${groupId}/turn-order`);
    return response.data;
  },

  updateTurnOrder: async (groupId, order) => {
    const response = await api.put(`/groups/${groupId}/turn-order`, { order });
    return response.data;
  }
};