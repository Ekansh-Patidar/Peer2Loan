import { useState, useEffect, useCallback } from 'react';
import { groupService } from '../services/groupService';

export const useMembers = (groupId) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMembers = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await groupService.getGroupMembers(groupId);
      console.log('Members API response:', response);
      // Get all members (including invited ones for group details page)
      const allMembers = response.data?.members || response.members || [];
      console.log('All members:', allMembers);
      setMembers(allMembers);
    } catch (err) {
      console.error('Error loading members:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const addMember = useCallback(async (userId) => {
    try {
      setLoading(true);
      await groupService.addMember(groupId, userId);
      await loadMembers();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [groupId, loadMembers]);

  const removeMember = useCallback(async (userId) => {
    try {
      setLoading(true);
      await groupService.removeMember(groupId, userId);
      await loadMembers();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [groupId, loadMembers]);

  return {
    members,
    loading,
    error,
    addMember,
    removeMember,
    refresh: loadMembers
  };
};