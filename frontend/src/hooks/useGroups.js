// src/hooks/useGroups.js
import { useContext } from 'react';
import { GroupContext } from '../context/GroupContext';

/**
 * Custom hook to use Group Context
 * Member 2: Group Management
 */
export const useGroups = () => {
  const context = useContext(GroupContext);
  
  if (!context) {
    throw new Error('useGroups must be used within GroupProvider');
  }
  
  return context;
};