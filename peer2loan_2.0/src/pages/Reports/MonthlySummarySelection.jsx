import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import './Reports.css';

const MonthlySummarySelection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const groupIdFromUrl = searchParams.get('groupId');
  
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(groupIdFromUrl || '');
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchCycles(selectedGroup);
    } else {
      setCycles([]);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups');
      const groupsList = response.groups || response.data?.groups || response || [];
      setGroups(Array.isArray(groupsList) ? groupsList : []);
    } catch (err) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchCycles = async (groupId) => {
    try {
      setLoadingCycles(true);
      const response = await api.get(`/groups/${groupId}`);
      const group = response.group || response.data?.group || response;
      
      // Generate cycle list based on group duration and current cycle
      const cycleList = [];
      const duration = group.duration || 0;
      const currentCycle = group.currentCycle || 1;
      
      for (let i = 1; i <= Math.min(currentCycle, duration); i++) {
        cycleList.push({
          cycleNumber: i,
          status: i < currentCycle ? 'completed' : i === currentCycle ? 'active' : 'pending'
        });
      }
      
      setCycles(cycleList);
    } catch (err) {
      console.error('Failed to load cycles:', err);
      setCycles([]);
    } finally {
      setLoadingCycles(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="reports-container">
        <div className="reports-header">
          <div>
            <Button variant="ghost" onClick={() => navigate('/reports')} style={{ marginBottom: '8px' }}>
              ← Back to Reports
            </Button>
            <h1>Monthly Summary</h1>
            <p className="reports-subtitle">Select a cycle to view detailed monthly summary</p>
          </div>
        </div>

        {error && (
          <Alert type="error" closable onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {groups.length === 0 ? (
          <Alert type="info">
            You don't have any groups yet. Create a group first to view monthly summaries.
          </Alert>
        ) : (
          <>
            <Card>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Select a Group
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '10px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">-- Select a group --</option>
                  {groups.map(group => (
                    <option key={group._id} value={group._id}>
                      {group.name} ({group.status})
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {selectedGroup && (
              <Card title="Cycles" subtitle="Click on a cycle to view its monthly summary">
                {loadingCycles ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader variant="spinner" size="medium" text="Loading cycles..." />
                  </div>
                ) : cycles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No cycles found for this group
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {cycles.map(cycle => (
                      <div
                        key={cycle.cycleNumber}
                        style={{
                          padding: '24px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: 'white',
                          textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#1976d2';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        onClick={() => navigate(`/groups/${selectedGroup}/summary/${cycle.cycleNumber}`)}
                      >
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '24px',
                          margin: '0 auto 12px'
                        }}>
                          {cycle.cycleNumber}
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>
                          Cycle {cycle.cycleNumber}
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          backgroundColor: cycle.status === 'completed' ? '#e3f2fd' : cycle.status === 'active' ? '#e8f5e9' : '#fff3e0',
                          color: cycle.status === 'completed' ? '#1976d2' : cycle.status === 'active' ? '#2e7d32' : '#f57c00',
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {cycle.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MonthlySummarySelection;
