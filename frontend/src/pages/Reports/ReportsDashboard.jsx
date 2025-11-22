import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import { useGroups } from '../../hooks/useGroups';
import '../Groups/Groups.css';

/**
 * ReportsDashboard - Reports hub page
 */
const ReportsDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { groups, loading, error, loadGroups } = useGroups();
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const reportTypes = [
    {
      id: 'group-ledger',
      title: 'Group Ledger',
      description: 'Complete transaction history for a group',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'blue',
      action: () => {
        if (selectedGroup) {
          navigate(`/groups/${selectedGroup}/ledger`);
        } else {
          alert('Please select a group first');
        }
      },
    },
    {
      id: 'member-ledger',
      title: 'Member Ledger',
      description: 'Individual member transaction history',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'green',
      action: () => {
        navigate('/members');
      },
    },
    {
      id: 'monthly-summary',
      title: 'Monthly Summary',
      description: 'Cycle-wise breakdown and analysis',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      color: 'purple',
      action: () => {
        if (selectedGroup) {
          navigate(`/groups/${selectedGroup}/summary`);
        } else {
          alert('Please select a group first');
        }
      },
    },
    {
      id: 'audit-log',
      title: 'Audit Log',
      description: 'Complete activity trail and history',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'orange',
      action: () => {
        if (selectedGroup) {
          navigate(`/groups/${selectedGroup}/audit`);
        } else {
          alert('Please select a group first');
        }
      },
    },
  ];

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading groups..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="groups-dashboard-container">
        <div className="groups-dashboard-header">
          <div>
            <h1>Reports</h1>
            <p className="groups-dashboard-subtitle">Access various reports and analytics</p>
          </div>
        </div>

        {error && (
          <Alert type="error" closable>
            {error}
          </Alert>
        )}

        {groups && groups.length > 0 && (
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Select a Group
              </label>
              <select
                value={selectedGroup || ''}
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
        )}

        {groups && groups.length === 0 && (
          <Alert type="info">
            You don't have any groups yet. Create a group first to access reports.
          </Alert>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {reportTypes.map((report) => (
            <Card key={report.id} variant="elevated" hoverable>
              <div style={{ padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `var(--${report.color}-light, #f0f0f0)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ width: '24px', height: '24px', color: `var(--${report.color}, #666)` }}>
                      {report.icon}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>{report.title}</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{report.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="small" style={{ width: '100%' }} onClick={report.action}>
                  View Report
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsDashboard;
