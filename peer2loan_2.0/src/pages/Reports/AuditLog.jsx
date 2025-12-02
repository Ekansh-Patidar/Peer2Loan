import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import './Reports.css';

const AuditLog = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAuditLog();
  }, [groupId, currentPage]);

  const fetchAuditLog = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/group/${groupId}/audit-log?page=${currentPage}&limit=50`);
      const data = response.data || response;
      setAuditData(data);
    } catch (err) {
      setError(err.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('peer2loan_token');
      const baseURL = 'http://localhost:5000/api/v1';
      const response = await fetch(`${baseURL}/reports/group/${groupId}/audit-log/export/csv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-log-${groupId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export CSV: ' + err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading audit log..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="error">{error}</Alert>
        <Button onClick={() => navigate('/reports/audit-log')} style={{ marginTop: '16px' }}>
          Back to Group Selection
        </Button>
      </DashboardLayout>
    );
  }

  if (!auditData || !auditData.logs) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="error">Unable to load audit log data</Alert>
        <Button onClick={() => navigate('/reports/audit-log')} style={{ marginTop: '16px' }}>
          Back to Group Selection
        </Button>
      </DashboardLayout>
    );
  }

  const getActionBadge = (action) => {
    const colors = {
      GROUP_CREATED: { bg: '#e8f5e9', color: '#2e7d32' },
      MEMBER_INVITED: { bg: '#e3f2fd', color: '#1976d2' },
      MEMBER_JOINED: { bg: '#e8f5e9', color: '#2e7d32' },
      PAYMENT_RECORDED: { bg: '#e3f2fd', color: '#1976d2' },
      PAYMENT_VERIFIED: { bg: '#c8e6c9', color: '#388e3c' },
      PAYMENT_CONFIRMED: { bg: '#e8f5e9', color: '#2e7d32' },
      PAYOUT_EXECUTED: { bg: '#e8f5e9', color: '#2e7d32' },
      PENALTY_APPLIED: { bg: '#ffebee', color: '#c62828' },
      CYCLE_STARTED: { bg: '#e3f2fd', color: '#1976d2' },
      CYCLE_COMPLETED: { bg: '#e8f5e9', color: '#2e7d32' },
    };
    const style = colors[action] || { bg: '#f5f5f5', color: '#666' };
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: '600',
        textTransform: 'uppercase',
        background: style.bg,
        color: style.color,
      }}>
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="reports-container">
        {/* Header */}
        <div className="reports-header">
          <div>
            <Button variant="ghost" onClick={() => navigate('/reports/audit-log')} style={{ marginBottom: '8px' }}>
              ← Back to Group Selection
            </Button>
            <h1>Audit Log</h1>
            <p className="reports-subtitle">Complete activity trail and history</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="outline" onClick={handleExportCSV}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', marginRight: '4px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </Button>
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

        {/* Stats */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Activities</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{auditData.pagination.total}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Page</div>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>
                {auditData.pagination.page} of {auditData.pagination.pages}
              </div>
            </div>
          </div>
        </Card>

        {/* Audit Log Timeline */}
        <Card title="Activity Timeline" subtitle={`${auditData.logs.length} activities on this page`}>
          {auditData.logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No audit log entries found
            </div>
          ) : (
            <div className="payments-timeline">
              {auditData.logs.map((log, index) => (
                <div key={log.id} className="payment-timeline-item">
                  <div className="timeline-marker">
                    <div className="timeline-dot" />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <div className="timeline-title">
                        {getActionBadge(log.action)}
                        <span style={{ marginLeft: '12px', fontSize: '14px', color: '#666' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="timeline-details">
                      <div style={{ marginBottom: '8px', fontSize: '14px', color: '#1a1a1a' }}>
                        {log.description}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                        <div>
                          <span style={{ color: '#666', fontWeight: '500' }}>Performed by: </span>
                          <span style={{ color: '#1a1a1a' }}>{log.performedBy}</span>
                        </div>
                        {log.affectedMember && (
                          <div>
                            <span style={{ color: '#666', fontWeight: '500' }}>Affected member: </span>
                            <span style={{ color: '#1a1a1a' }}>{log.affectedMember}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {auditData.pagination.pages > 1 && (
          <div className="pagination">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="pagination-info">
              Page {currentPage} of {auditData.pagination.pages}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(p => Math.min(auditData.pagination.pages, p + 1))}
              disabled={currentPage === auditData.pagination.pages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuditLog;
