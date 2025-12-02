import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Loader, Alert } from '../../components/common';
import GroupCard from '../../components/features/groups/GroupCard/GroupCard';
import './GroupList.css';

const GroupList = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { groups, loading, error, loadGroups, deleteExistingGroup } = useGroups();

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader variant="spinner" size="large" text="Loading groups..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="group-list-page">
        <div className="page-header">
          <div>
            <h1>My Groups</h1>
            <p className="page-subtitle">Manage your savings groups</p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/groups/create')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create New Group
          </Button>
        </div>

        {error && (
          <Alert type="error" title="Error" closable>
            {error}
          </Alert>
        )}

        {!groups || groups.length === 0 ? (
          <Card>
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '64px', height: '64px', color: '#9e9e9e' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h2>No groups yet</h2>
              <p>Create your first savings group to get started with Peer2Loan.</p>
              <Button
                variant="primary"
                onClick={() => navigate('/groups/create')}
                style={{ marginTop: '16px' }}
              >
                Create Your First Group
              </Button>
            </div>
          </Card>
        ) : (
          <div className="groups-grid">
            {groups.map(group => (
              <GroupCard
                key={group._id || group.id}
                group={group}
                onSelect={(id) => navigate(`/groups/${id}`)}
                onEdit={(id) => navigate(`/groups/${id}/edit`)}
                onDelete={async (id) => {
                  if (window.confirm('Are you sure you want to delete this group?')) {
                    const result = await deleteExistingGroup(id);
                    if (!result.success) {
                      alert('Failed to delete group: ' + result.error);
                    }
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GroupList;