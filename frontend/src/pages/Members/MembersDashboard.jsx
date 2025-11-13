import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Table, Alert, Input } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import '../Groups/Groups.css';

/**
 * MembersDashboard - Members management page
 * This is a placeholder layout ready for backend integration
 */
const MembersDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');

  // Placeholder data - will be replaced with API calls
  const members = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+91 98765 43210',
      groupName: 'Family Savings Group',
      groupId: '1',
      role: 'organizer',
      turnNumber: 1,
      status: 'active',
      paymentStreak: 3,
      performanceScore: 95,
      totalContributed: 15000,
      payoutReceived: 0,
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+91 98765 43211',
      groupName: 'Friends Investment Circle',
      groupId: '2',
      role: 'member',
      turnNumber: 3,
      status: 'active',
      paymentStreak: 5,
      performanceScore: 100,
      totalContributed: 50000,
      payoutReceived: 80000,
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '+91 98765 43212',
      groupName: 'Office Colleagues Fund',
      groupId: '3',
      role: 'member',
      turnNumber: 2,
      status: 'suspended',
      paymentStreak: 0,
      performanceScore: 45,
      totalContributed: 6000,
      payoutReceived: 0,
    },
  ];

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === 'all' || member.groupId === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const getStatusBadge = (status) => {
    const colors = {
      active: { bg: '#e8f5e9', color: '#2e7d32' },
      suspended: { bg: '#ffebee', color: '#c62828' },
      defaulted: { bg: '#fff3e0', color: '#f57c00' },
      exited: { bg: '#f5f5f5', color: '#666' },
    };
    const style = colors[status] || colors.active;
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
      title: 'Member',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: 'Group',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (groupName, record) => (
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{groupName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Turn #{record.turnNumber}</div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            background: role === 'organizer' ? '#e3f2fd' : '#f5f5f5',
            color: role === 'organizer' ? '#1976d2' : '#666',
          }}
        >
          {role}
        </span>
      ),
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '13px', marginBottom: '4px' }}>
            Score: <span style={{ fontWeight: '600' }}>{record.performanceScore}/100</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Streak: {record.paymentStreak} cycles
          </div>
        </div>
      ),
    },
    {
      title: 'Financials',
      key: 'financials',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px', color: '#666' }}>Contributed</div>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            ₹{record.totalContributed.toLocaleString()}
          </div>
          {record.payoutReceived > 0 && (
            <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '4px' }}>
              Received: ₹{record.payoutReceived.toLocaleString()}
            </div>
          )}
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="small"
            variant="primary"
            onClick={() => navigate(`/members/${record.id}/ledger`)}
          >
            View Ledger
          </Button>
          <Button
            size="small"
            variant="outline"
            onClick={() => alert('Member details coming soon!')}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  // Calculate stats
  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.status === 'active').length,
    suspendedMembers: members.filter((m) => m.status === 'suspended').length,
    avgPerformance: Math.round(
      members.reduce((sum, m) => sum + m.performanceScore, 0) / members.length
    ),
  };

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="groups-dashboard-container">
        {/* Header */}
        <div className="groups-dashboard-header">
          <div>
            <h1>Members</h1>
            <p className="groups-dashboard-subtitle">Manage all members across groups</p>
          </div>
          <Button variant="primary" onClick={() => alert('Invite member feature coming soon!')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Invite Member
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
                <div className="stat-label">Total Members</div>
                <div className="stat-value">{stats.totalMembers}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Active Members</div>
                <div className="stat-value">{stats.activeMembers}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Suspended</div>
                <div className="stat-value">{stats.suspendedMembers}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Avg Performance</div>
                <div className="stat-value">{stats.avgPerformance}%</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Input
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: '300px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant={filterGroup === 'all' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => setFilterGroup('all')}
              >
                All Groups
              </Button>
              <Button variant="ghost" size="small">
                Active
              </Button>
              <Button variant="ghost" size="small">
                Suspended
              </Button>
            </div>
          </div>
        </Card>

        {/* Members Table */}
        <Card title="All Members" subtitle={`${filteredMembers.length} member(s)`}>
          {filteredMembers.length > 0 ? (
            <Table columns={columns} data={filteredMembers} striped hoverable />
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '64px', height: '64px', stroke: '#ccc', marginBottom: '16px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <h3>No members found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MembersDashboard;
