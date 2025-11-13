import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import '../Groups/Groups.css';

/**
 * ReportsDashboard - Reports hub page
 * This is a placeholder layout ready for backend integration
 */
const ReportsDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
      action: () => alert('Select a group to view ledger'),
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
      action: () => alert('Select a member to view ledger'),
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
      action: () => alert('Select a group to view summary'),
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
      action: () => alert('Select a group to view audit log'),
    },
  ];

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="groups-dashboard-container">
        <div className="groups-dashboard-header">
          <div>
            <h1>Reports</h1>
            <p className="groups-dashboard-subtitle">Access various reports and analytics</p>
          </div>
        </div>

        <Alert type="info">
          This is a placeholder layout. Backend integration will be added by other team members.
        </Alert>

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
