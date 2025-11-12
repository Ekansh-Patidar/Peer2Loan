import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Alert, Loader, Button } from '../../components/common';
import useDashboard from '../../hooks/useDashboard';
import useAuth from '../../hooks/useAuth';
import './Dashboard.css';

/**
 * OverviewDashboard - Overview of all groups user is part of
 */
const OverviewDashboard = () => {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useDashboard('overview');
  const { user, logout } = useAuth();

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div className="dashboard-loading">
          <Loader variant="spinner" size="large" />
          <p>Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="error" title="Error">
          {error}
        </Alert>
        <Button onClick={refresh} style={{ marginTop: '16px' }}>
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="info">No dashboard data available</Alert>
      </DashboardLayout>
    );
  }

  const { summary, groups } = data;

  const getStatusBadge = (status) => {
    const colors = {
      active: { bg: '#e8f5e9', color: '#2e7d32' },
      pending: { bg: '#fff3e0', color: '#f57c00' },
      completed: { bg: '#e3f2fd', color: '#1976d2' },
      cancelled: { bg: '#ffebee', color: '#c62828' },
    };

    const style = colors[status] || colors.pending;

    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          background: style.bg,
          color: style.color,
          textTransform: 'uppercase',
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>My Groups Overview</h1>
            <p className="dashboard-subtitle">All your Peer2Loan groups in one place</p>
          </div>
          <div className="dashboard-actions">
            <Button variant="primary" onClick={() => navigate('/groups/create')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Group
            </Button>
            <Button variant="outline" onClick={refresh}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="overview-summary-grid">
          <Card variant="elevated">
            <div className="summary-card">
              <div className="summary-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="summary-content">
                <div className="summary-label">Total Groups</div>
                <div className="summary-value">{summary.totalGroups}</div>
                <div className="summary-subtext">
                  {summary.activeGroups} active • {summary.completedGroups} completed
                </div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="summary-card">
              <div className="summary-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="summary-content">
                <div className="summary-label">Total Contributed</div>
                <div className="summary-value">₹{summary.totalContributed.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="summary-card">
              <div className="summary-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="summary-content">
                <div className="summary-label">Total Received</div>
                <div className="summary-value">₹{summary.totalReceived.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="summary-card">
              <div className={`summary-icon ${summary.netPosition >= 0 ? 'green' : 'red'}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </div>
              <div className="summary-content">
                <div className="summary-label">Net Position</div>
                <div className={`summary-value ${summary.netPosition >= 0 ? 'positive' : 'negative'}`}>
                  ₹{Math.abs(summary.netPosition).toLocaleString()}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Groups List */}
        <Card title="Your Groups" subtitle={`${groups.length} group${groups.length !== 1 ? 's' : ''}`}>
          {groups && groups.length > 0 ? (
            <div className="groups-grid">
              {groups.map((group) => (
                <div
                  key={group.groupId}
                  className="group-card"
                  onClick={() => navigate(`/groups/${group.groupId}/dashboard`)}
                >
                  <div className="group-card-header">
                    <h3>{group.groupName}</h3>
                    {getStatusBadge(group.groupStatus)}
                  </div>

                  <div className="group-card-body">
                    <div className="group-info-row">
                      <span className="label">Your Role:</span>
                      <span className="value">{group.role}</span>
                    </div>
                    <div className="group-info-row">
                      <span className="label">Your Turn:</span>
                      <span className="value">#{group.turnNumber}</span>
                    </div>
                    <div className="group-info-row">
                      <span className="label">Progress:</span>
                      <span className="value">
                        Cycle {group.currentCycle} of {group.totalCycles}
                      </span>
                    </div>
                  </div>

                  <div className="group-card-footer">
                    <div className="group-stat">
                      <span className="stat-label">Contributed</span>
                      <span className="stat-value">₹{group.totalContributed.toLocaleString()}</span>
                    </div>
                    <div className="group-stat">
                      <span className="stat-label">Received</span>
                      <span className="stat-value">₹{group.payoutAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {group.hasReceivedPayout && (
                    <div className="payout-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      Payout Received
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3>No Groups Yet</h3>
              <p>Create or join a group to get started</p>
              <Button variant="primary" onClick={() => navigate('/groups/create')}>
                Create Your First Group
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OverviewDashboard;
