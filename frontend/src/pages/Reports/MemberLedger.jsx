import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import './Reports.css';

const MemberLedger = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLedger();
  }, [memberId]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/member/${memberId}/ledger`);
      console.log('Full response:', response);
      // The response might be wrapped, so let's check
      const data = response.data || response;
      console.log('Extracted data:', data);
      setLedger(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load member ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('peer2loan_token');
      const baseURL = 'http://localhost:5000/api/v1';
      const response = await fetch(`${baseURL}/reports/member/${memberId}/export/csv`, {
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
      link.setAttribute('download', `member-ledger-${memberId}.csv`);
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
          <Loader variant="spinner" size="large" text="Loading member ledger..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="error">{error}</Alert>
        <Button onClick={() => navigate('/reports/member-ledger')} style={{ marginTop: '16px' }}>
          Back to Member Selection
        </Button>
      </DashboardLayout>
    );
  }

  if (!ledger) {
    return null;
  }

  console.log('Ledger check:', {
    hasMember: !!ledger.member,
    hasGroup: !!ledger.group,
    hasSummary: !!ledger.summary,
    ledger
  });

  if (!ledger.member || !ledger.group || !ledger.summary) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="error">Unable to load member ledger data</Alert>
        <div style={{ marginTop: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(ledger, null, 2)}
          </pre>
        </div>
        <Button onClick={() => navigate('/reports/member-ledger')} style={{ marginTop: '16px' }}>
          Back to Member Selection
        </Button>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: '#fff3e0', color: '#f57c00' },
      paid: { bg: '#e3f2fd', color: '#1976d2' },
      verified: { bg: '#c8e6c9', color: '#388e3c' },
      confirmed: { bg: '#e8f5e9', color: '#2e7d32' },
    };
    const style = colors[status] || colors.pending;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
        background: style.bg,
        color: style.color,
      }}>
        {status}
      </span>
    );
  };

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="reports-container">
        {/* Header */}
        <div className="reports-header">
          <div>
            <Button variant="ghost" onClick={() => navigate('/reports/member-ledger')} style={{ marginBottom: '8px' }}>
              ← Back to Member Selection
            </Button>
            <h1>Member Ledger</h1>
            <p className="reports-subtitle">
              {ledger.member.name} • Turn #{ledger.member.turnNumber} • {ledger.group.name}
            </p>
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
            <Button variant="primary" onClick={fetchLedger}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="stats-grid">
          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Contributed</div>
                <div className="stat-value">₹{(ledger.summary.totalContributed || 0).toLocaleString()}</div>
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
                <div className="stat-label">Payout Received</div>
                <div className="stat-value">₹{(ledger.summary.payoutReceived || 0).toLocaleString()}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Penalties</div>
                <div className="stat-value">₹{(ledger.summary.totalPenalties || 0).toLocaleString()}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Net Position</div>
                <div className="stat-value" style={{ color: (ledger.summary.netPosition || 0) >= 0 ? '#2e7d32' : '#c62828' }}>
                  {(ledger.summary.netPosition || 0) >= 0 ? '+' : ''}₹{Math.abs(ledger.summary.netPosition || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Contribution History */}
        <Card title="Contribution History" subtitle={`${ledger.contributionHistory?.length || 0} payments`}>
          {ledger.contributionHistory && ledger.contributionHistory.length > 0 ? (
            <div className="payments-table">
              <table>
                <thead>
                  <tr>
                    <th>Cycle</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Late</th>
                    <th>Late Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.contributionHistory.map((payment, idx) => (
                    <tr key={idx} className={payment.isLate ? 'late-payment' : ''}>
                      <td>#{payment.cycleNumber || 'N/A'}</td>
                      <td>{payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}</td>
                      <td>₹{(payment.amount || 0).toLocaleString()}</td>
                      <td>{getStatusBadge(payment.status || 'pending')}</td>
                      <td>{payment.isLate ? 'Yes' : 'No'}</td>
                      <td>{payment.lateFee ? `₹${payment.lateFee}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No contribution history available
            </div>
          )}
        </Card>

        {/* Payout */}
        {ledger.payout && (
          <Card title="Payout Received">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Amount</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#2e7d32' }}>
                  ₹{ledger.payout.amount.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {new Date(ledger.payout.date).toLocaleDateString()}
                </div>
              </div>
              {ledger.payout.reference && (
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Reference</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {ledger.payout.reference}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MemberLedger;
