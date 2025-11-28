import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import './Reports.css';

const MemberLedgerSelection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const groupIdFromUrl = searchParams.get('groupId');
  
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(groupIdFromUrl || '');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchMembers(selectedGroup);
    } else {
      setMembers([]);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups');
      console.log('Groups API response:', response);
      // Handle different response structures
      const groupsList = response.groups || response.data?.groups || response || [];
      console.log('Extracted groups:', groupsList);
      setGroups(Array.isArray(groupsList) ? groupsList : []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (groupId) => {
    try {
      setLoadingMembers(true);
      const response = await api.get(`/groups/${groupId}/members`);
      const membersList = response.members || response.data?.members || response || [];
      setMembers(Array.isArray(membersList) ? membersList : []);
    } catch (err) {
      console.error('Failed to load members:', err);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
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
            <h1>Member Ledger</h1>
            <p className="reports-subtitle">Select a member to view their transaction history</p>
          </div>
        </div>

        {error && (
          <Alert type="error" closable onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {groups.length === 0 ? (
          <Alert type="info">
            You don't have any groups yet. Create a group first to view member ledgers.
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
              <Card title="Group Members" subtitle="Click on a member to view their ledger">
                {loadingMembers ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader variant="spinner" size="medium" text="Loading members..." />
                  </div>
                ) : members.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No members found in this group
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {members.map(member => (
                      <div
                        key={member._id}
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
                        onClick={() => navigate(`/members/${member._id}/ledger`)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '20px'
                          }}>
                            {member.user?.name?.charAt(0).toUpperCase() || 'M'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                              {member.user?.name || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              Turn #{member.turnNumber}
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
                          <span style={{ 
                            textTransform: 'capitalize',
                            fontWeight: '500'
                          }}>
                            {member.role}
                          </span>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            backgroundColor: member.status === 'active' ? '#e8f5e9' : '#fff3e0',
                            color: member.status === 'active' ? '#2e7d32' : '#f57c00',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {member.status}
                          </span>
                        </div>
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

export default MemberLedgerSelection;
