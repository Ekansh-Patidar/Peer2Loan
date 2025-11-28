import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import './Reports.css';

const MonthlySummary = () => {
  const { groupId, cycleNumber } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [groupId, cycleNumber]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/group/${groupId}/monthly/${cycleNumber}`);
      const data = response.data || response;
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load monthly summary');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('peer2loan_token');
      const baseURL = 'http://localhost:5000/api/v1';
      const response = await fetch(`${baseURL}/reports/group/${groupId}/monthly/${cycleNumber}/export/csv`, {
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
      link.setAttribute('download', `monthly-summary-cycle-${cycleNumber}.csv`);
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
          <Loader variant="spinner" size="large" text="Loading monthly summary..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="error">{error}</Alert>
        <Button onClick={() => navigate('/reports/monthly-summary')} style={{ marginTop: '16px' }}>
          Back to Cycle Selection
        </Button>
      </DashboardLayout>
    );
  }

  if (!summary || !summary.cycle || !summary.beneficiary || !summary.financials) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="error">Unable to load monthly summary data</Alert>
        <Button onClick={() => navigate('/reports/monthly-summary')} style={{ marginTop: '16px' }}>
          Back to Cycle Selection
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
      completed: { bg: '#e3f2fd', color: '#1976d2' },
      active: { bg: '#e8f5e9', color: '#2e7d32' },
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
            <Button variant="ghost" onClick={() => navigate('/reports/monthly-summary')} style={{ marginBottom: '8px' }}>
              ← Back to Cycle Selection
            </Button>
            <h1>Monthly Summary - Cycle {summary.cycle.cycleNumber}</h1>
            <p className="reports-subtitle">
              {new Date(summary.cycle.startDate).toLocaleDateString()} - {new Date(summary.cycle.endDate).toLocaleDateString()}
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
            <Button variant="primary" onClick={fetchSummary}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Cycle Status */}
        <Card title="Cycle Status">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Status</div>
              {getStatusBadge(summary.cycle.status)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Beneficiary</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                {summary.beneficiary.name} (Turn #{summary.beneficiary.turnNumber})
              </div>
            </div>
          </div>
        </Card>

        {/* Financial Summary */}
        <div className="stats-grid">
          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Collected Amount</div>
                <div className="stat-value">₹{summary.financials.collectedAmount.toLocaleString()}</div>
                <div className="stat-subtext">of ₹{summary.financials.expectedAmount.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Variance</div>
                <div className="stat-value" style={{ color: summary.financials.variance >= 0 ? '#2e7d32' : '#c62828' }}>
                  {summary.financials.variance >= 0 ? '+' : ''}₹{summary.financials.variance.toLocaleString()}
                </div>
                <div className="stat-subtext">{summary.financials.variance >= 0 ? 'Surplus' : 'Deficit'}</div>
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
                <div className="stat-value">₹{(summary.financials.totalPenalties || 0).toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Payments */}
        <Card title="Payments" subtitle={`${summary.payments?.length || 0} members`}>
          {summary.payments && summary.payments.length > 0 ? (
            <div className="payments-table">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Turn</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Paid At</th>
                    <th>Late</th>
                    <th>Days Late</th>
                    <th>Late Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.payments.map((payment, idx) => (
                    <tr key={idx} className={payment.isLate ? 'late-payment' : ''}>
                      <td>{payment.member}</td>
                      <td>#{payment.turnNumber}</td>
                      <td>₹{payment.amount.toLocaleString()}</td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td>{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}</td>
                      <td>{payment.isLate ? 'Yes' : 'No'}</td>
                      <td>{payment.daysLate || 0}</td>
                      <td>{payment.lateFee ? `₹${payment.lateFee}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No payment data available
            </div>
          )}
        </Card>

        {/* Payout */}
        {summary.payout && (
          <Card title="Payout Information">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Amount</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#2e7d32' }}>
                  ₹{summary.payout.amount.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Status</div>
                {getStatusBadge(summary.payout.status)}
              </div>
              {summary.payout.completedAt && (
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Completed</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>
                    {new Date(summary.payout.completedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
              {summary.payout.transferReference && (
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Reference</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {summary.payout.transferReference}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Summary Text */}
        {summary.summary && (
          <Card title="Summary">
            <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6' }}>
              {summary.summary}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MonthlySummary;
