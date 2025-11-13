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
      const response = await groupService.getGroupById(groupId);
      setMembers(response.data.members || []);
    } catch (err) {
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