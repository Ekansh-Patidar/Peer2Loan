import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import { useMembers } from '../../hooks/useMembers';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Loader } from '../../components/common';
import MemberList from '../../components/features/groups/MemberList/MemberList';
import InviteModal from '../../components/features/groups/InviteModal/InviteModal';
import './GroupDetails.css';

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentGroup, selectGroup, deleteExistingGroup } = useGroups();
  const { members, loading: membersLoading, removeMember } = useMembers(id);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    selectGroup(id);
  }, [id, selectGroup]);

  const handleInvite = async (groupId, email, turnNumber) => {
    try {
      const { groupService } = await import('../../services/groupService');
      await groupService.sendInvitation(groupId, email, turnNumber);
      setShowInviteModal(false);
      alert('Invitation sent successfully!');
    } catch (error) {
      alert('Failed to send invitation: ' + error.message);
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      const result = await deleteExistingGroup(id);
      if (result.success) {
        navigate('/groups');
      } else {
        alert('Failed to delete group: ' + result.error);
      }
    }
  };

  if (!currentGroup) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading group details..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="group-details-page">
        <div className="page-header">
          <div className="group-title">
            <h1>{currentGroup.name}</h1>
            <span className={`status-badge ${currentGroup.status}`}>
              {currentGroup.status}
            </span>
          </div>
          <div className="group-actions">
            <button
              className="btn-edit"
              onClick={() => navigate(`/groups/${id}/edit`)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Group
            </button>
            <button
              className="btn-delete"
              onClick={handleDeleteGroup}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Delete Group
            </button>
          </div>
        </div>

        <div className="group-info">
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Members:</span>
              <span className="value">{currentGroup.memberCount}</span>
            </div>
            <div className="info-item">
              <span className="label">Monthly Contribution:</span>
              <span className="value">₹{currentGroup.monthlyContribution}</span>
            </div>
            <div className="info-item">
              <span className="label">Cycle:</span>
              <span className="value">{currentGroup.currentCycle}</span>
            </div>
            <div className="info-item">
              <span className="label">Start Date:</span>
              <span className="value">{new Date(currentGroup.startDate).toLocaleDateString()}</span>
            </div>
          </div>
          {currentGroup.description && (
            <div className="group-description">
              <h3>Description</h3>
              <p>{currentGroup.description}</p>
            </div>
          )}
        </div>

        <div className="group-sections">
          <div className="section">
            <div className="section-header">
              <h2>Members</h2>
              <button
                className="btn-invite"
                onClick={() => setShowInviteModal(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Invite Member
              </button>
            </div>
            {membersLoading ? (
              <div className="loading">Loading members...</div>
            ) : (
              <MemberList
                members={members}
                onRemove={removeMember}
                canEdit={true}
                currentUserId={user?._id}
              />
            )}
          </div>
        </div>

        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
          groupId={id}
        />
      </div>
    </DashboardLayout>
  );
};

export default GroupDetails;