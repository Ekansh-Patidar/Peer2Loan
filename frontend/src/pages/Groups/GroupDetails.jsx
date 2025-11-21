import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import { useMembers } from '../../hooks/useMembers';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Loader } from '../../components/common';
import MemberList from '../../components/features/groups/MemberList/MemberList';
import InviteModal from '../../components/features/groups/InviteModal/InviteModal';
import TurnOrderView from '../../components/features/groups/TurnOrderView/TurnOrderView';
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
            className="btn-secondary"
            onClick={() => navigate(`/groups/${id}/edit`)}
          >
            Edit Group
          </button>
          <button
            className="btn-danger"
            onClick={handleDeleteGroup}
          >
            Delete Group
          </button>
        </div>
      </div>

      <div className="group-info">
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Members:</span>
            <span className="value">{currentGroup.memberCount}/{currentGroup.groupSize}</span>
          </div>
          <div className="info-item">
            <span className="label">Monthly Contribution:</span>
            <span className="value">₹{currentGroup.monthlyContribution}</span>
          </div>
          <div className="info-item">
            <span className="label">Cycle:</span>
            <span className="value">{currentGroup.currentCycle}/{currentGroup.totalCycles}</span>
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
              className="btn-primary"
              onClick={() => setShowInviteModal(true)}
            >
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

        <div className="section">
          <h2>Turn Order</h2>
          <TurnOrderView
            turnOrder={currentGroup.turnOrder}
            currentTurn={currentGroup.currentTurn}
          />
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