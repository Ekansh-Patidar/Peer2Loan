import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Table, Alert, Input, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import { useGroups } from '../../hooks/useGroups';
import '../Groups/Groups.css';

/**
 * MembersDashboard - Members management page
 */
const MembersDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { groups, loading, error, fetchAllGroups } = useGroups();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (fetchAllGroups) {
      fetchAllGroups();
    }
  }, [fetchAllGroups]);

  useEffect(() => {
    // Fetch members for all groups
    const fetchAllMembers = async () => {
      if (groups && Array.isArray(groups) && groups.length > 0) {
        try {
          const api = (await import('../../services/api')).default;
          const allMembers = [];
          
          // Fetch members for each group
          for (const group of groups) {
            try {
              const response = await api.get(`/groups/${group._id}/members`);
              const groupMembers = response.data?.members || [];
              
              groupMembers.forEach(member => {
                allMembers.push({
                  ...member,
                  groupName: group.name,
                  groupId: group._id,
                  groupStatus: group.status,
                });
              });
            } catch (err) {
              console.error(`Failed to fetch members for group ${group._id}:`, err);
            }
          }
          
          setMembers(allMembers);
        } catch (err) {
          console.error('Failed to fetch members:', err);
        }
      }
    };

    fetchAllMembers();
  }, [groups]);

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading members..." />
        </div>
      </DashboardLayout>
    );
  }

  const filteredMembers = members.filter((member) => {
    const userName = member.user?.name || '';
    const userEmail = member.user?.email || '';
    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === 'all' || member.groupId === filterGroup;
    return matchesSearch && matchesGroup;
  });

  // Group members by group
  const membersByGroup = filteredMembers.reduce((acc, member) => {
    const groupId = member.groupId;
    if (!acc[groupId]) {
      acc[groupId] = {
        groupName: member.groupName,
        groupId: groupId,
        groupStatus: member.groupStatus,
        members: []
      };
    }
    acc[groupId].members.push(member);
    return acc;
  }, {});

  // Sort groups by name and members by turn number
  const sortedGroups = Object.values(membersByGroup).sort((a, b) => 
    a.groupName.localeCompare(b.groupName)
  );
  
  sortedGroups.forEach(group => {
    group.members.sort((a, b) => (a.turnNumber || 0) - (b.turnNumber || 0));
  });

  // Get unique groups for filter
  const uniqueGroups = [...new Set(members.map(m => m.groupId))].map(groupId => {
    const member = members.find(m => m.groupId === groupId);
    return { id: groupId, name: member?.groupName };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const getStatusBadge = (status) => {
    const colors = {
      active: { bg: '#e8f5e9', color: '#2e7d32' },
      invited: { bg: '#e3f2fd', color: '#1976d2' },
      suspended: { bg: '#ffebee', color: '#c62828' },
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
      key: 'member',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{record.user?.name || 'Unknown'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.user?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Group',
      key: 'group',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{record.groupName}</div>
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
          {role || 'member'}
        </span>
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
            variant="outline"
            onClick={() => navigate(`/groups/${record.groupId}`)}
          >
            View Group
          </Button>
        </div>
      ),
    },
  ];

  // Calculate stats
  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.status === 'active').length,
    invitedMembers: members.filter((m) => m.status === 'invited').length,
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
          <Button variant="primary" onClick={() => navigate('/groups')}>
            View Groups
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" closable>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="groups-stats-grid">
          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
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
              <div className="stat-icon yellow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Invited</div>
                <div className="stat-value">{stats.invitedMembers}</div>
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
              {uniqueGroups.slice(0, 3).map(group => (
                <Button
                  key={group.id}
                  variant={filterGroup === group.id ? 'primary' : 'ghost'}
                  size="small"
                  onClick={() => setFilterGroup(group.id)}
                >
                  {group.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Members Grouped by Group */}
        {sortedGroups.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {sortedGroups.map((group) => (
              <Card 
                key={group.groupId}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>{group.groupName}</span>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: group.groupStatus === 'active' ? '#e8f5e9' : '#fff3e0',
                        color: group.groupStatus === 'active' ? '#2e7d32' : '#f57c00',
                      }}
                    >
                      {group.groupStatus}
                    </span>
                  </div>
                }
                subtitle={`${group.members.length} member(s)`}
                variant="elevated"
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {group.members.map((member) => (
                    <div
                      key={member._id}
                      style={{
                        padding: '16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        background: '#fafafa',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1976d2';
                        e.currentTarget.style.background = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                        e.currentTarget.style.background = '#fafafa';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: member.role === 'organizer' ? '#1976d2' : '#4caf50',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: '600',
                            flexShrink: 0,
                          }}
                        >
                          {(member.user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a1a' }}>
                              {member.user?.name || 'Unknown'}
                            </div>
                            {member.role === 'organizer' && (
                              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px', color: '#1976d2' }}>
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                              </svg>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                            {member.user?.email || 'N/A'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              Turn #{member.turnNumber}
                            </div>
                            {getStatusBadge(member.status)}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                        <Button
                          size="small"
                          variant="outline"
                          onClick={() => navigate(`/groups/${group.groupId}`)}
                          style={{ width: '100%' }}
                        >
                          View Group
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : members.length === 0 ? (
          <Card>
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '64px', height: '64px', stroke: '#ccc', marginBottom: '16px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <h3>No members yet</h3>
              <p>You don't have any groups with members yet. Create a group and invite members to get started.</p>
              <Button variant="primary" onClick={() => navigate('/groups/create')} style={{ marginTop: '16px' }}>
                Create Group
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '64px', height: '64px', stroke: '#ccc', marginBottom: '16px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <h3>No members found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MembersDashboard;
