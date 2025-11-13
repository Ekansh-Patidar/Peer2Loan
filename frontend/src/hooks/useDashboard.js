import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';

/**
 * Custom hook for dashboard data management
 */
const useDashboard = (type = 'overview', groupId = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch dashboard data based on type
   */
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      
      switch (type) {
        case 'group':
          if (!groupId) throw new Error('Group ID is required for group dashboard');
          response = await dashboardService.getGroupDashboard(groupId);
          break;
          
        case 'member':
          if (!groupId) throw new Error('Group ID is required for member dashboard');
          response = await dashboardService.getMemberDashboard(groupId);
          break;
          
        case 'overview':
        default:
          response = await dashboardService.getOverviewDashboard();
          break;
      }

      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [type, groupId]);

  /**
   * Refresh dashboard data
   */
  const refresh = useCallback(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refresh,
  };
};

export default useDashboard;
