import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Alert, Loader, Button, Table } from '../../components/common';
import reportService from '../../services/reportService';
import useAuth from '../../hooks/useAuth';
import './Reports.css';

/**
 * MemberLedger - Individual member's transaction history
 */
const MemberLedger = () => {
  const { memberId } = useParams();
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLedger();
  }, [memberId]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportService.getMemberLedger(memberId);
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch member ledger');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div className="reports-loading">
          <Loader variant="spinner" size="large" />
          <p>Loading ledger...</p>
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
        <Button onClick={fetchLedger} style={{ marginTop: '16px' }}>
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="info">No ledger data available</Alert>
      </DashboardLayout>
    );
  }

  const { member, group, transactions, summary } = data;

  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Cycle',
      dataIndex: 'cycleNumber',
      key: 'cycleNumber',
      render: (cycle) => `#${cycle}`,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            background: type === 'contribution' ? '#e3f2fd' : type === 'payout' ? '#e8f5e9' : '#fff3e0',
            color: type === 'contribution' ? '#1976d2' : type === 'payout' ? '#2e7d32' : '#f57c00',
          }}
        >
          {type}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Debit',
      dataIndex: 'debit',
      key: 'debit',
      render: (amount) => (amount > 0 ? `₹${amount.toLocaleString()}` : '-'),
    },
    {
      title: 'Credit',
      dataIndex: 'credit',
      key: 'credit',
      render: (amount) => (amount > 0 ? `₹${amount.toLocaleString()}` : '-'),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => (
        <span style={{ fontWeight: '600', color: balance >= 0 ? '#4caf50' : '#f44336' }}>
          ₹{Math.abs(balance).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="reports-container">
        {/* Header */}
        <div className="reports-header">
          <div>
            <h1>Member Ledger</h1>
            <p className="reports-subtitle">
              {member.name} • Turn #{member.turnNumber} • {group.name}
            </p>
          </div>
          <div className="reports-actions">
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

        {/* Member Summary */}
        <div className="member-summary-grid">
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Total Contributed</div>
              <div className="summary-stat-value">₹{summary.totalContributed.toLocaleString()}</div>
              <div className="summary-stat-subtext">{summary.contributionCount} payments</div>
            </div>
          </Card>
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Payout Received</div>
              <div className="summary-stat-value green">₹{summary.payoutReceived.toLocaleString()}</div>
              <div className="summary-stat-subtext">{summary.hasReceivedPayout ? 'Received' : 'Pending'}</div>
            </div>
          </Card>
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Penalties</div>
              <div className="summary-stat-value red">₹{summary.totalPenalties.toLocaleString()}</div>
              <div className="summary-stat-subtext">
                {summary.latePayments} late • {summary.missedPayments} missed
              </div>
            </div>
          </Card>
          <Card variant="elevated">
            <div className="summary-stat">
              <div className="summary-stat-label">Net Position</div>
              <div className={`summary-stat-value ${summary.netPosition >= 0 ? 'green' : 'red'}`}>
                ₹{Math.abs(summary.netPosition).toLocaleString()}
              </div>
              <div className="summary-stat-subtext">{summary.netPosition >= 0 ? 'Credit' : 'Debit'}</div>
            </div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card title="Performance Metrics">
          <div className="performance-metrics">
            <div className="metric-item">
              <div className="metric-label">Payment Streak</div>
              <div className="metric-value">{member.paymentStreak} cycles</div>
              <div className="metric-bar">
                <div
                  className="metric-bar-fill green"
                  style={{ width: `${Math.min((member.paymentStreak / group.totalCycles) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Performance Score</div>
              <div className="metric-value">{member.performanceScore}/100</div>
              <div className="metric-bar">
                <div className="metric-bar-fill blue" style={{ width: `${member.performanceScore}%` }}></div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">On-Time Payment Rate</div>
              <div className="metric-value">
                {summary.contributionCount > 0
                  ? Math.round(((summary.contributionCount - summary.latePayments) / summary.contributionCount) * 100)
                  : 0}
                %
              </div>
              <div className="metric-bar">
                <div
                  className="metric-bar-fill purple"
                  style={{
                    width: `${
                      summary.contributionCount > 0
                        ? ((summary.contributionCount - summary.latePayments) / summary.contributionCount) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction History */}
        <Card title="Transaction History" subtitle={`${transactions.length} transaction(s)`}>
          {transactions.length > 0 ? (
            <Table columns={columns} data={transactions} striped hoverable />
          ) : (
            <div className="empty-state">
              <p>No transactions found</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MemberLedger;
