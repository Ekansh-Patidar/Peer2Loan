import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import logo from '../../../assets/images/logo.svg';
import api from '../../../services/api';

const Header = ({ user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();

  // Fetch notification count (invitations + in-app notifications)
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        // Fetch both invitations and unread notifications
        const [invitationsRes, notificationsRes] = await Promise.all([
          api.get('/members/my-invitations'),
          api.get('/notifications/count')
        ]);

        const invitationCount = invitationsRes.data?.invitations?.length || 0;
        const unreadCount = notificationsRes.data?.count || 0;

        setNotificationCount(invitationCount + unreadCount);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    if (user) {
      fetchNotificationCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.header-user')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    if (onLogout) {
      await onLogout();
    }
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <img src={logo} alt="Peer2Loan" />
        </Link>

        <nav className="header-nav">
          <Link to="/dashboard" className="header-nav-link">Dashboard</Link>
          <Link to="/groups" className="header-nav-link">Groups</Link>
          <Link to="/members" className="header-nav-link">Members</Link>
          <Link to="/payments" className="header-nav-link">Payments</Link>
          <Link to="/payouts" className="header-nav-link">Payouts</Link>
          <Link to="/reports" className="header-nav-link">Reports</Link>
        </nav>

        <div className="header-actions">
          <button
            className="header-notification-btn"
            aria-label="Notifications"
            onClick={() => navigate('/notifications')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>

          <div className="header-user">
            <button
              className="header-user-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="header-user-avatar">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="header-user-name">{user?.name || 'User'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="header-user-menu">
                <Link to="/profile" className="header-user-menu-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>

                <button className="header-user-menu-item" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
