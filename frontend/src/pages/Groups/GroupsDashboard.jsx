import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Table, Alert, Input } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import './Groups.css';

/**
 * GroupsDashboard - Main groups management page
 * This is a placeholder layout ready for backend integration
 */
const GroupsDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Placeholder data - will be replaced with API calls
  const groups = [
    {
      id: '1',
      name: 'Family Savings Group',
      status: 'active',
      memberCount: 10,
      monthlyContribution: 5000,
      currentCycle: 3,
      totalCycles: 10,
      role: 'organizer',
    },
    {
      id: '2',
      name: 'Friends Investment Circle',
      status: 'active',
      memberCount: 8,
      monthlyContribution: 10000,
      currentCycle: 5,
      totalCycles: 8,
      role: 'member',
    },
    {
      id: '3',
      name: 'Office Colleagues Fund',
      status: 'pending',
      memberCount: 6,
      monthlyContribution: 3000,
      currentCycle: 0,
      totalCycles: 6,
      role: 'member',
    },
  ];

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          textTransform: 'uppercase',
          background: style.bg,
          color: style.color,
        }}
      >
        {status}
      </span>
    );
  };

  const columns = [
    {
      title: 'Group Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.memberCount} members • ₹{record.monthlyContribution.toLocaleString()}/month
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusBadge(status),
    },
    {
      title: 'Progress',
      dataIndex: 'currentCycle',
      key: 'progress',
      render: (current, record) => (
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            Cycle {current} of {record.totalCycles}
          </div>
          <div style={{ width: '100%', height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
            <div
              style={{
                width: `${(current / record.totalCycles) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #2196f3 0%, #42a5f5 100%)',
                borderRadius: '3px',
              }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      title: 'Your Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <span style={{ textTransform: 'capitalize', color: '#666' }}>{role}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="small"
            variant="primary"
            onClick={() => navigate(`/groups/${record.id}/dashboard`)}
          >
            View
          </Button>
          {record.role === 'organizer' && (
            <Button
              size="small"
              variant="outline"
              onClick={() => navigate(`/groups/${record.id}/manage`)}
            >
              Manage
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="groups-dashboard-container">
        {/* Header */}
        <div className="groups-dashboard-header">
          <div>
            <h1>My Groups</h1>
            <p className="groups-dashboard-subtitle">Manage your chit fund groups</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/groups/create')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create New Group
          </Button>
        </div>

        {/* Info Alert */}
        <Alert type="info">
          This is a placeholder layout. Backend integration will be added by other team members.
        </Alert>

        {/* Stats Cards */}
        <div className="groups-stats-grid">
          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Groups</div>
                <div className="stat-value">{groups.length}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Active Groups</div>
                <div className="stat-value">{groups.filter((g) => g.status === 'active').length}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">As Organizer</div>
                <div className="stat-value">{groups.filter((g) => g.role === 'organizer').length}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: '300px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" size="small">All</Button>
              <Button variant="ghost" size="small">Active</Button>
              <Button variant="ghost" size="small">Pending</Button>
              <Button variant="ghost" size="small">Completed</Button>
            </div>
          </div>
        </Card>

        {/* Groups Table */}
        <Card title="Your Groups" subtitle={`${filteredGroups.length} group(s)`}>
          {filteredGroups.length > 0 ? (
            <Table columns={columns} data={filteredGroups} striped hoverable />
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '64px', height: '64px', stroke: '#ccc', marginBottom: '16px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3>No groups found</h3>
              <p>Create your first group to get started</p>
              <Button variant="primary" onClick={() => navigate('/groups/create')} style={{ marginTop: '16px' }}>
                Create Group
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GroupsDashboard;
