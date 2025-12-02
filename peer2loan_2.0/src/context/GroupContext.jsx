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
      // Handle different response structures
      const groupsData = response.data?.groups || response.groups || response.data || [];
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (err) {
      setError(err.message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectGroup = useCallback(async (groupId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupService.getGroupById(groupId);
      // Handle different response structures
      const groupData = response.data?.group || response.group || response.data;
      setCurrentGroup(groupData);
      return groupData;
    } catch (err) {
      setError(err.message);
      setCurrentGroup(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewGroup = useCallback(async (groupData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupService.createGroup(groupData);
      const newGroup = response.data?.group || response.group || response.data;
      setGroups(prev => [...prev, newGroup]);
      return { success: true, data: newGroup };
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
      const updatedGroup = response.data?.group || response.group || response.data;
      
      // Update the groups list
      setGroups(prev => prev.map(g => 
        (g._id === groupId || g.id === groupId) ? updatedGroup : g
      ));
      setCurrentGroup(updatedGroup);
      
      // Reload groups to ensure consistency
      await loadGroups();
      
      return { success: true, data: updatedGroup };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadGroups]);

  const deleteExistingGroup = useCallback(async (groupId) => {
    try {
      setLoading(true);
      setError(null);
      await groupService.deleteGroup(groupId);
      
      // Remove from groups list
      setGroups(prev => prev.filter(g => g._id !== groupId && g.id !== groupId));
      
      // Clear current group if it's the one being deleted
      if (currentGroup?._id === groupId || currentGroup?.id === groupId) {
        setCurrentGroup(null);
      }
      
      // Reload groups to ensure consistency
      await loadGroups();
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentGroup, loadGroups]);

  const value = {
    groups,
    currentGroup,
    loading,
    error,
    loadGroups,
    fetchAllGroups: loadGroups, // Alias for consistency
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