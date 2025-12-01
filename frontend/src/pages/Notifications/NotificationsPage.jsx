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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invitationsRes, notificationsRes] = await Promise.all([
        api.get('/members/my-invitations'),
        api.get('/notifications')
      ]);
      setInvitations(invitationsRes.data?.invitations || []);
      setNotifications(notificationsRes.data?.notifications || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (groupId) => {
    try {
      setProcessingId(groupId);
      await api.post(`/groups/${groupId}/accept`);
      alert('Invitation accepted!');
      fetchData();
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
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };


  const getNotificationIcon = (type) => {
    const icons = {
      payout_pending_approval: { className: 'pending', path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      payout_approved: { className: 'approved', path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      payout_completed: { className: 'completed', path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
    };
    const icon = icons[type] || { className: 'default', path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' };
    
    return (
      <div className={`notification-icon ${icon.className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={icon.path} />
        </svg>
      </div>
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalCount = invitations.length + notifications.length;

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
          <div>
            <h1>Notifications</h1>
            <p className="page-subtitle">
              {totalCount > 0 ? `${totalCount} notification(s)` : 'No notifications'}
              {unreadCount > 0 && ` • ${unreadCount} unread`}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="small" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {error && <Alert type="error" closable onClose={() => setError(null)}>{error}</Alert>}

        <div className="notification-tabs">
          <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            All ({totalCount})
          </button>
          <button className={`tab ${activeTab === 'invitations' ? 'active' : ''}`} onClick={() => setActiveTab('invitations')}>
            Invitations ({invitations.length})
          </button>
          <button className={`tab ${activeTab === 'payouts' ? 'active' : ''}`} onClick={() => setActiveTab('payouts')}>
            Payouts ({notifications.filter(n => n.type?.includes('payout')).length})
          </button>
        </div>

        {totalCount === 0 ? (
          <Card>
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '64px', height: '64px', color: '#9e9e9e' }}>
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h2>No notifications</h2>
              <p>You're all caught up!</p>
            </div>
          </Card>
        ) : (
          <div className="notifications-list">
            {(activeTab === 'all' || activeTab === 'invitations') && invitations.map((inv) => (
              <Card key={`inv-${inv._id}`} variant="elevated">
                <div className="invitation-card">
                  <div className="notification-icon invitation">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="invitation-content">
                    <h3>Group Invitation</h3>
                    <p className="invitation-group-name">{inv.group?.name}</p>
                    <div className="invitation-details">
                      <span>₹{inv.group?.monthlyContribution?.toLocaleString()}/month</span>
                      <span>•</span>
                      <span>Turn #{inv.turnNumber}</span>
                    </div>
                  </div>
                  <div className="invitation-actions">
                    <Button variant="success" size="small" onClick={() => handleAccept(inv.group._id)} disabled={processingId === inv.group._id}>Accept</Button>
                    <Button variant="outline" size="small" onClick={() => handleReject(inv.group._id, inv._id)} disabled={processingId === inv.group._id}>Reject</Button>
                  </div>
                </div>
              </Card>
            ))}

            {(activeTab === 'all' || activeTab === 'payouts') && notifications
              .filter(n => activeTab === 'all' || n.type?.includes('payout'))
              .map((notif) => (
              <Card key={`notif-${notif._id}`} variant="elevated" className={!notif.isRead ? 'unread' : ''}>
                <div className="notification-card clickable" onClick={() => handleNotificationClick(notif)}>
                  {getNotificationIcon(notif.type)}
                  <div className="notification-content">
                    <div className="notification-header">
                      <h3>{notif.title}</h3>
                      {!notif.isRead && <span className="unread-dot"></span>}
                    </div>
                    <p className="notification-message">{notif.message}</p>
                    <div className="notification-meta">
                      <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                      {notif.group?.name && <span>• {notif.group.name}</span>}
                    </div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ color: '#9ca3af' }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
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
