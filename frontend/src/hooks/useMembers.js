
// src/hooks/useMembers.js
import { useState, useCallback } from 'react';
import groupService from '../services/groupService';
import { useNotification } from './useNotification';

/**
 * Custom hook for member-specific operations
 * Member 2: Member Management
 */
export const useMembers = (groupId) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  /**
   * Fetch members for a specific group
   */
  const fetchMembers = useCallback(async () => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await groupService.getGroupMembers(groupId);
      setMembers(response.data.members || []);
      return response.data.members;
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch members';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [groupId, showNotification]);

  /**
   * Invite a new member
   */
  const inviteMember = useCallback(async (inviteData) => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await groupService.inviteMember(groupId, inviteData);
      await fetchMembers(); // Refresh members list
      showNotification('Member invited successfully!', 'success');
      return response.data;
    } catch (err) {
      const errorMsg = err.message || 'Failed to invite member';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [groupId, fetchMembers, showNotification]);

  /**
   * Remove a member
   */
  const removeMember = useCallback(async (memberId) => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    try {
      await groupService.removeMember(groupId, memberId);
      setMembers(prev => prev.filter(m => m._id !== memberId));
      showNotification('Member removed successfully', 'success');
    } catch (err) {
      const errorMsg = err.message || 'Failed to remove member';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [groupId, showNotification]);

  /**
   * Update member details
   */
  const updateMember = useCallback(async (memberId, updateData) => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await groupService.updateMember(groupId, memberId, updateData);
      setMembers(prev => prev.map(m => 
        m._id === memberId ? response.data.member : m
      ));
      showNotification('Member updated successfully', 'success');
      return response.data.member;
    } catch (err) {
      const errorMsg = err.message || 'Failed to update member';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [groupId, showNotification]);

  /**
   * Resend invitation
   */
  const resendInvitation = useCallback(async (memberId) => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    try {
      await groupService.resendInvitation(groupId, memberId);
      showNotification('Invitation resent successfully', 'success');
    } catch (err) {
      const errorMsg = err.message || 'Failed to resend invitation';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [groupId, showNotification]);

  /**
   * Get member by ID
   */
  const getMemberById = useCallback((memberId) => {
    return members.find(m => m._id === memberId) || null;
  }, [members]);

  /**
   * Get members by status
   */
  const getMembersByStatus = useCallback((status) => {
    return members.filter(m => m.status === status);
  }, [members]);

  /**
   * Get active members count
   */
  const getActiveCount = useCallback(() => {
    return members.filter(m => m.status === 'active').length;
  }, [members]);

  /**
   * Get pending members count
   */
  const getPendingCount = useCallback(() => {
    return members.filter(m => m.status === 'pending').length;
  }, [members]);

  return {
    members,
    loading,
    error,
    fetchMembers,
    inviteMember,
    removeMember,
    updateMember,
    resendInvitation,
    getMemberById,
    getMembersByStatus,
    getActiveCount,
    getPendingCount,
  };
};