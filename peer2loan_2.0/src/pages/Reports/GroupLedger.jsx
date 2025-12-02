import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert, Loader, Table } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import './Reports.css';

const GroupLedger = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCycle, setExpandedCycle] = useState(null);

  useEffect(() => {
    fetchLedger();
  }, [groupId]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/group/${groupId}/ledger`);
      setLedger(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('peer2loan_token');
      const baseURL = 'http://localhost:5000/api/v1';
      const response = await fetch(`${baseURL}/reports/group/${groupId}/export/csv`, {
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
      link.setAttribute('download', `group-ledger-${groupId}.csv`);
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
          <Loader variant="spinner" size="large" text="Loading ledger..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="error">{error}</Alert>
        <Button onClick={() => navigate('/reports')} style={{ marginTop: '16px' }}>
          Back to Reports
        </Button>
      </DashboardLayout>
    );
  }

  if (!ledger) return null;

  const getStatusBadge = (status) => {
    const colors = {
      active: { bg: '#e8f5e9', color: '#2e7d32' },
      pending: { bg: '#fff3e0', color: '#f57c00' },
      completed: { bg: '#e3f2fd', color: '#1976d2' },
      cancelled: { bg: '#ffebee', color: '#c62828' },
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
            <Button variant="ghost" onClick={() => navigate('/reports')} style={{ marginBottom: '8px' }}>
              ← Back to Reports
            </Button>
            <h1>Group Ledger</h1>
            <p className="reports-subtitle">{ledger.group.name}</p>
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

        {/* Group Summary */}
        <Card title="Group Summary">
          <div className="ledger-summary-grid">
            <div className="summary-item">
              <span className="label">Monthly Contribution</span>
              <span className="value">₹{ledger.group.monthlyContribution.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="label">Members</span>
              <span className="value">{ledger.group.memberCount}</span>
            </div>
            <div className="summary-item">
              <span className="label">Duration</span>
              <span className="value">{ledger.group.duration} months</span>
            </div>
            <div className="summary-item">
              <span className="label">Status</span>
              {getStatusBadge(ledger.group.status)}
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
                <div className="stat-label">Total Collected</div>
                <div className="stat-value">₹{ledger.stats.totalCollected.toLocaleString()}</div>
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
                <div className="stat-label">Total Disbursed</div>
                <div className="stat-value">₹{ledger.stats.totalDisbursed.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon yellow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Penalties</div>
                <div className="stat-value">₹{ledger.stats.totalPenalties.toLocaleString()}</div>
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
                <div className="stat-label">Completed Cycles</div>
                <div className="stat-value">{ledger.stats.completedCycles}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Cycles */}
        <Card title="Cycle-wise Breakdown" subtitle={`${ledger.cycles.length} cycles`}>
          <div className="cycles-list">
            {ledger.cycles.map((cycle) => (
              <div key={cycle.cycleNumber} className="cycle-card">
                <div 
                  className="cycle-header"
                  onClick={() => setExpandedCycle(expandedCycle === cycle.cycleNumber ? null : cycle.cycleNumber)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="cycle-title">
                    <h3>Cycle {cycle.cycleNumber}</h3>
                    {getStatusBadge(cycle.status)}
                  </div>
                  <div className="cycle-summary">
                    <div className="cycle-info">
                      <span className="label">Beneficiary:</span>
                      <span className="value">{cycle.beneficiary} (Turn #{cycle.beneficiaryTurn})</span>
                    </div>
                    <div className="cycle-info">
                      <span className="label">Period:</span>
                      <span className="value">
                        {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="cycle-info">
                      <span className="label">Collection:</span>
                      <span className="value">
                        ₹{cycle.collectedAmount.toLocaleString()} / ₹{cycle.expectedAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="cycle-info">
                      <span className="label">Payments:</span>
                      <span className="value">
                        {cycle.paidCount} paid, {cycle.pendingCount} pending, {cycle.lateCount} late
                      </span>
                    </div>
                  </div>
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{
                      width: '20px',
                      height: '20px',
                      transform: expandedCycle === cycle.cycleNumber ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {expandedCycle === cycle.cycleNumber && (
                  <div className="cycle-details">
                    <h4>Payment Details</h4>
                    <div className="payments-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Turn</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Paid At</th>
                            <th>Late Fee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cycle.payments.map((payment, idx) => (
                            <tr key={idx} className={payment.isLate ? 'late-payment' : ''}>
                              <td>{payment.member}</td>
                              <td>#{payment.turnNumber}</td>
                              <td>₹{payment.amount.toLocaleString()}</td>
                              <td>{getStatusBadge(payment.status)}</td>
                              <td>{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}</td>
                              <td>{payment.lateFee ? `₹${payment.lateFee}` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {cycle.payout && (
                      <div className="payout-info">
                        <h4>Payout Information</h4>
                        <div className="payout-details">
                          <div className="payout-item">
                            <span className="label">Amount:</span>
                            <span className="value">₹{cycle.payout.amount.toLocaleString()}</span>
                          </div>
                          <div className="payout-item">
                            <span className="label">Status:</span>
                            {getStatusBadge(cycle.payout.status)}
                          </div>
                          {cycle.payout.completedAt && (
                            <div className="payout-item">
                              <span className="label">Completed:</span>
                              <span className="value">{new Date(cycle.payout.completedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          {cycle.payout.transferReference && (
                            <div className="payout-item">
                              <span className="label">Reference:</span>
                              <span className="value">{cycle.payout.transferReference}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GroupLedger;
