import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import './Reports.css';

const AuditLogSelection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const groupIdFromUrl = searchParams.get('groupId');
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

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

  // Navigate to audit log if groupId is provided in URL
  useEffect(() => {
    if (groupIdFromUrl && groups.length > 0) {
      navigate(`/groups/${groupIdFromUrl}/audit`);
    }
  }, [groupIdFromUrl, groups, navigate]);

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
            <h1>Audit Log</h1>
            <p className="reports-subtitle">Select a group to view its activity trail</p>
          </div>
        </div>

        {error && (
          <Alert type="error" closable onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {groups.length === 0 ? (
          <Alert type="info">
            You don't have any groups yet. Create a group first to view audit logs.
          </Alert>
        ) : (
          <Card title="Select a Group">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {groups.map(group => (
                <div
                  key={group._id}
                  style={{
                    padding: '20px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
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
                  onClick={() => navigate(`/groups/${group._id}/audit`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '20px'
                    }}>
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                        {group.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {group.memberCount} members • {group.duration} months
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px',
                    color: '#666',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <span>View Activity Log</span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      backgroundColor: group.status === 'active' ? '#e8f5e9' : '#fff3e0',
                      color: group.status === 'active' ? '#2e7d32' : '#f57c00',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {group.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuditLogSelection;
