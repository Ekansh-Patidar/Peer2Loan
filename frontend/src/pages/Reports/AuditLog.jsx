import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Alert, Loader, Button, Table, Input } from '../../components/common';
import reportService from '../../services/reportService';
import useAuth from '../../hooks/useAuth';
import './Reports.css';

/**
 * AuditLog - Complete audit trail of all group activities
 */
const AuditLog = () => {
  const { groupId } = useParams();
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 50;

  useEffect(() => {
    fetchAuditLog();
  }, [groupId, page]);

  const fetchAuditLog = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportService.getAuditLog(groupId, { page, limit });
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch audit log');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div className="reports-loading">
          <Loader variant="spinner" size="large" />
          <p>Loading audit log...</p>
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
        <Button onClick={fetchAuditLog} style={{ marginTop: '16px' }}>
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="info">No audit log data available</Alert>
      </DashboardLayout>
    );
  }

  const { group, logs, pagination } = data;

  // Filter logs by search term
  const filteredLogs = logs.filter(
    (log) =>
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get action icon and color
  const getActionStyle = (action) => {
    const styles = {
      create: { icon: '➕', color: '#4caf50' },
      update: { icon: '✏️', color: '#2196f3' },
      delete: { icon: '🗑️', color: '#f44336' },
      payment: { icon: '💰', color: '#ff9800' },
      payout: { icon: '💸', color: '#9c27b0' },
      member_add: { icon: '👤', color: '#00bcd4' },
      member_remove: { icon: '👤', color: '#f44336' },
      cycle_start: { icon: '▶️', color: '#4caf50' },
      cycle_complete: { icon: '✅', color: '#4caf50' },
      status_change: { icon: '🔄', color: '#ff9800' },
    };
    return styles[action] || { icon: '📝', color: '#757575' };
  };

  // Table columns
  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => (
        <div style={{ fontSize: '13px' }}>
          <div>{new Date(date).toLocaleDateString()}</div>
          <div style={{ color: '#999', fontSize: '11px' }}>{new Date(date).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => {
        const style = getActionStyle(action);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>{style.icon}</span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                background: `${style.color}20`,
                color: style.color,
              }}
            >
              {action.replace(/_/g, ' ')}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Performed By',
      dataIndex: 'performedBy',
      key: 'performedBy',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (details) => <div style={{ maxWidth: '400px', fontSize: '13px' }}>{details}</div>,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip) => <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>{ip || '-'}</span>,
    },
  ];

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="reports-container">
        {/* Header */}
        <div className="reports-header">
          <div>
            <h1>Audit Log</h1>
            <p className="reports-subtitle">{group.name}</p>
          </div>
          <div className="reports-actions">
            <Button variant="primary" onClick={fetchAuditLog}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Info Alert */}
        <Alert type="info">
          Audit log tracks all activities in the group including payments, payouts, member changes, and administrative actions.
        </Alert>

        {/* Search */}
        <Card>
          <Input
            placeholder="Search by action, user, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: '500px' }}
          />
        </Card>

        {/* Audit Log Table */}
        <Card title="Activity Log" subtitle={`${filteredLogs.length} of ${pagination.total} entries`}>
          {filteredLogs.length > 0 ? (
            <>
              <Table columns={columns} data={filteredLogs} striped hoverable />

              {/* Pagination */}
              <div className="pagination">
                <Button
                  variant="outline"
                  size="small"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="small"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No audit log entries found</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AuditLog;
