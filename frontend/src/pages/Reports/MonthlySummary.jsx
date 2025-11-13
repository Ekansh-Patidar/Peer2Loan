import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Alert, Loader, Button, Table, Input } from '../../components/common';
import reportService from '../../services/reportService';
import useAuth from '../../hooks/useAuth';
import './Reports.css';

/**
 * MonthlySummary - Monthly/Cycle-wise summary report
 */
const MonthlySummary = () => {
  const { groupId } = useParams();
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState(1);

  useEffect(() => {
    if (selectedCycle) {
      fetchSummary();
    }
  }, [groupId, selectedCycle]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportService.getMonthlySummary(groupId, selectedCycle);
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch monthly summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div className="reports-loading">
          <Loader variant="spinner" size="large" />
          <p>Loading summary...</p>
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
        <Button onClick={fetchSummary} style={{ marginTop: '16px' }}>
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="info">No summary data available</Alert>
      </DashboardLayout>
    );
  }

  const { group, cycle, payments, summary } = data;

  // Payment status table columns
  const paymentColumns = [
    {
      title: 'Turn',
      dataIndex: 'turnNumber',
      key: 'turnNumber',
      render: (turn) => `#${turn}`,
    },
    {
      title: 'Member',
      dataIndex: 'memberName',
      key: 'memberName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            background: status === 'paid' ? '#e8f5e9' : status === 'pending' ? '#fff3e0' : '#ffebee',
            color: status === 'paid' ? '#2e7d32' : status === 'pending' ? '#f57c00' : '#c62828',
          }}
        >
          {status.toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Paid On',
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-'),
    },
    {
      title: 'Late Fee',
      dataIndex: 'lateFee',
      key: 'lateFee',
      render: (fee) => (fee > 0 ? `₹${fee}` : '-'),
    },
  ];

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="reports-container">
        {/* Header */}
        <div className="reports-header">
          <div>
            <h1>Monthly Summary</h1>
            <p className="reports-subtitle">{group.name}</p>
          </div>
          <div className="reports-actions">
            <Input
              type="number"
              min="1"
              max={group.totalCycles}
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(parseInt(e.target.value))}
              label="Cycle"
              style={{ width: '120px' }}
            />
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

        {/* Cycle Info */}
        <Card title={`Cycle ${cycle.cycleNumber} Details`} variant="elevated">
          <div className="cycle-details-grid">
            <div className="detail-item">
              <span className="label">Beneficiary:</span>
              <span className="value">{cycle.beneficiary} (Turn {cycle.beneficiaryTurn})</span>
            </div>
            <div className="detail-item">
              <span className="label">Period:</span>
              <span className="value">
                {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Status:</span>
              <span className="value">
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    background:
                      cycle.status === 'completed' ? '#e8f5e9' : cycle.status === 'active' ? '#e3f2fd' : '#fff3e0',
                    color: cycle.status === 'completed' ? '#2e7d32' : cycle.status === 'active' ? '#1976d2' : '#f57c00',
                  }}
                >
                  {cycle.status}
                </span>
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Payout Status:</span>
              <span className="value">{cycle.isPayoutCompleted ? 'Completed' : 'Pending'}</span>
            </div>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="summary-stats-grid">
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Expected Amount</div>
              <div className="summary-stat-value">₹{summary.expectedAmount.toLocaleString()}</div>
            </div>
          </Card>
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Collected Amount</div>
              <div className="summary-stat-value green">₹{summary.collectedAmount.toLocaleString()}</div>
              <div className="summary-stat-subtext">{summary.collectionPercentage}% collected</div>
            </div>
          </Card>
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Payout Amount</div>
              <div className="summary-stat-value blue">₹{summary.payoutAmount.toLocaleString()}</div>
            </div>
          </Card>
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Late Fees</div>
              <div className="summary-stat-value red">₹{summary.totalLateFees.toLocaleString()}</div>
            </div>
          </Card>
        </div>

        {/* Payment Status Overview */}
        <div className="payment-status-grid">
          <Card variant="outlined">
            <div className="status-overview-item">
              <div className="status-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="status-content">
                <div className="status-label">Paid</div>
                <div className="status-value">{summary.paidCount}</div>
              </div>
            </div>
          </Card>
          <Card variant="outlined">
            <div className="status-overview-item">
              <div className="status-icon yellow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="status-content">
                <div className="status-label">Pending</div>
                <div className="status-value">{summary.pendingCount}</div>
              </div>
            </div>
          </Card>
          <Card variant="outlined">
            <div className="status-overview-item">
              <div className="status-icon red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="status-content">
                <div className="status-label">Late</div>
                <div className="status-value">{summary.lateCount}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Payment Details Table */}
        <Card title="Payment Details" subtitle={`${payments.length} member(s)`}>
          {payments.length > 0 ? (
            <Table columns={paymentColumns} data={payments} striped hoverable />
          ) : (
            <div className="empty-state">
              <p>No payment data available</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MonthlySummary;
