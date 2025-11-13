import { createContext, useState, useCallback } from 'react';
import { groupService } from '../services/groupService';

export const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupService.getAllGroups();
      setGroups(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectGroup = useCallback(async (groupId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupService.getGroupById(groupId);
      setCurrentGroup(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewGroup = useCallback(async (groupData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupService.createGroup(groupData);
      setGroups(prev => [...prev, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExistingGroup = useCallback(async (groupId, updates) => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupService.updateGroup(groupId, updates);
      setGroups(prev => prev.map(g => g.id === groupId ? response.data : g));
      setCurrentGroup(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExistingGroup = useCallback(async (groupId) => {
    try {
      setLoading(true);
      setError(null);
      await groupService.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (currentGroup?.id === groupId) setCurrentGroup(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentGroup]);

  const value = {
    groups,
    currentGroup,
    loading,
    error,
    loadGroups,
    selectGroup,
    createNewGroup,
    updateExistingGroup,
    deleteExistingGroup
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};