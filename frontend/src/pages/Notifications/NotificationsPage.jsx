import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Loader, Alert } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/members/my-invitations');
      // The axios interceptor returns response.data, so response is the ApiResponse object
      // ApiResponse has: { success, statusCode, message, data: { invitations: [...] } }
      setInvitations(response.data?.invitations || []);
    } catch (err) {
      setError(err.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (groupId) => {
    try {
      setProcessingId(groupId);
      await api.post(`/groups/${groupId}/accept`);
      alert('Invitation accepted! You are now a member of the group.');
      fetchInvitations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (groupId, memberId) => {
    try {
      setProcessingId(groupId);
      await api.post(`/members/${memberId}/reject`);
      alert('Invitation rejected');
      fetchInvitations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject invitation');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading notifications..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="notifications-page">
        <div className="page-header">
          <h1>Notifications</h1>
          <p className="page-subtitle">Manage your group invitations</p>
        </div>

        {error && (
          <Alert type="error" closable>
            {error}
          </Alert>
        )}

        {invitations.length === 0 ? (
          <Card>
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '64px', height: '64px', color: '#9e9e9e' }}>
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h2>No pending invitations</h2>
              <p>You're all caught up! New group invitations will appear here.</p>
            </div>
          </Card>
        ) : (
          <div className="invitations-list">
            {invitations.map((invitation) => (
              <Card key={invitation._id} variant="elevated">
                <div className="invitation-card">
                  <div className="invitation-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="invitation-content">
                    <h3>Group Invitation</h3>
                    <p className="invitation-group-name">{invitation.group?.name}</p>
                    <div className="invitation-details">
                      <div className="detail-item">
                        <span className="detail-label">Monthly Contribution:</span>
                        <span className="detail-value">₹{invitation.group?.monthlyContribution?.toLocaleString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Your Turn Number:</span>
                        <span className="detail-value">#{invitation.turnNumber}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Group Size:</span>
                        <span className="detail-value">{invitation.group?.memberCount} members</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Start Date:</span>
                        <span className="detail-value">{new Date(invitation.group?.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {invitation.group?.description && (
                      <p className="invitation-description">{invitation.group.description}</p>
                    )}
                  </div>
                  <div className="invitation-actions">
                    <Button
                      variant="success"
                      onClick={() => handleAccept(invitation.group._id)}
                      disabled={processingId === invitation.group._id}
                    >
                      {processingId === invitation.group._id ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleReject(invitation.group._id, invitation._id)}
                      disabled={processingId === invitation.group._id}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
