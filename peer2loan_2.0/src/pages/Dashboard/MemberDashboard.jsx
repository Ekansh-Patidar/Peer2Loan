import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Alert, Loader, Button, Table } from '../../components/common';
import { PotCounter } from '../../components/features/dashboard';
import useDashboard from '../../hooks/useDashboard';
import useAuth from '../../hooks/useAuth';
import './Dashboard.css';

/**
 * MemberDashboard - Member view of their participation in a group
 */
const MemberDashboard = () => {
  const { groupId } = useParams();
  const { data, loading, error, refresh } = useDashboard('member', groupId);
  const { user, logout } = useAuth();

  if (loading) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div className="dashboard-loading">
          <Loader variant="spinner" size="large" />
          <p>Loading dashboard...</p>
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
        <Button onClick={refresh} style={{ marginTop: '16px' }}>
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="info">No dashboard data available</Alert>
      </DashboardLayout>
    );
  }

  const { member, group, financials, upcomingTurn, currentCyclePayment, recentPayments, unpaidPenalties } = data;

  // Payment history table columns
  const paymentColumns = [
    { title: 'Cycle', dataIndex: 'cycleNumber', key: 'cycleNumber' },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
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
          {record.isLate && ' (Late)'}
        </span>
      ),
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
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>{group.name}</h1>
            <p className="dashboard-subtitle">
              Your Turn: #{member.turnNumber} • Cycle {group.currentCycle} of {group.totalCycles}
            </p>
          </div>
          <div className="dashboard-actions">
            <Button variant="outline" onClick={refresh}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Payment Alert */}
        {currentCyclePayment && currentCyclePayment.status === 'pending' && (
          <Alert type="warning" title="Payment Due">
            {currentCyclePayment.includedPenalties > 0 ? (
              <>
                <div>Your payment of <strong>₹{currentCyclePayment.amount.toLocaleString()}</strong> is due by{' '}
                  {new Date(currentCyclePayment.dueDate).toLocaleDateString()}</div>
                <div style={{ fontSize: '13px', marginTop: '8px', color: '#666' }}>
                  • Base Contribution: ₹{currentCyclePayment.baseContribution.toLocaleString()}<br />
                  • Unpaid Penalties: ₹{currentCyclePayment.includedPenalties.toLocaleString()}
                </div>
              </>
            ) : (
              <>
                Your payment of ₹{currentCyclePayment.amount.toLocaleString()} is due by{' '}
                {new Date(currentCyclePayment.dueDate).toLocaleDateString()}
              </>
            )}
            <Button variant="primary" size="small" style={{ marginTop: '12px' }}>
              Pay Now
            </Button>
          </Alert>
        )}

        {/* Unpaid Penalties Alert */}
        {unpaidPenalties && unpaidPenalties.length > 0 && (
          <Alert type="error" title="Unpaid Penalties">
            You have {unpaidPenalties.length} unpaid {unpaidPenalties.length === 1 ? 'penalty' : 'penalties'} totaling ₹{financials.unpaidPenalties.toLocaleString()}. Please clear these to maintain good standing.
          </Alert>
        )}

        {/* Member Stats Grid */}
        <div className="member-stats-grid">
          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Contributed</div>
                <div className="stat-value">₹{financials.totalContributed.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Payout Received</div>
                <div className="stat-value">₹{financials.payoutReceived.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className={`stat-icon ${financials.netPosition >= 0 ? 'green' : 'red'}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Net Position</div>
                <div className={`stat-value ${financials.netPosition >= 0 ? 'positive' : 'negative'}`}>
                  ₹{Math.abs(financials.netPosition).toLocaleString()}
                </div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Payment Streak</div>
                <div className="stat-value">{member.paymentStreak}</div>
                <div className="stat-subtext">Score: {member.performanceScore}/100</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Turn */}
        {upcomingTurn && (
          <Card title="Your Upcoming Turn" variant="elevated">
            <div className="upcoming-turn-card">
              <PotCounter amount={upcomingTurn.amount} label="You will receive" />
              <div className="turn-details">
                <div className="turn-detail-item">
                  <span className="label">Cycle Number:</span>
                  <span className="value">{upcomingTurn.cycleNumber}</span>
                </div>
                <div className="turn-detail-item">
                  <span className="label">Scheduled Date:</span>
                  <span className="value">{new Date(upcomingTurn.scheduledDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Unpaid Penalties */}
        {unpaidPenalties && unpaidPenalties.length > 0 && (
          <Card title="Unpaid Penalties" variant="elevated">
            <div className="penalties-list">
              {unpaidPenalties.map((penalty) => (
                <div key={penalty.id} className="penalty-item">
                  <div className="penalty-header">
                    <span className="penalty-type">
                      {penalty.type === 'late_fee' ? 'Late Fee' : penalty.type === 'default_penalty' ? 'Default Penalty' : 'Custom Penalty'}
                    </span>
                    <span className="penalty-amount">₹{penalty.amount.toLocaleString()}</span>
                  </div>
                  <div className="penalty-details">
                    <span>Cycle {penalty.cycleNumber}</span>
                    {penalty.daysLate > 0 && <span> • {penalty.daysLate} days late</span>}
                    <span> • {penalty.reason}</span>
                  </div>
                  <div className="penalty-date">Applied on: {new Date(penalty.appliedAt).toLocaleDateString()}</div>
                </div>
              ))}
              <div className="penalties-total">
                <span>Total Unpaid:</span>
                <span className="total-amount">₹{financials.unpaidPenalties.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Payment Performance */}
        <div className="performance-grid">
          <Card title="Payment Performance" variant="outlined">
            <div className="performance-stats">
              <div className="performance-item">
                <span className="label">Missed Payments:</span>
                <span className="value error">{financials.missedPayments}</span>
              </div>
              <div className="performance-item">
                <span className="label">Late Payments:</span>
                <span className="value warning">{financials.latePayments}</span>
              </div>
              <div className="performance-item">
                <span className="label">Total Penalties:</span>
                <span className="value">₹{financials.totalPenalties.toLocaleString()}</span>
              </div>
              <div className="performance-item">
                <span className="label">Unpaid Penalties:</span>
                <span className="value error">₹{financials.unpaidPenalties.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Payments */}
        <Card title="Recent Payments" subtitle="Your payment history">
          {recentPayments && recentPayments.length > 0 ? (
            <Table columns={paymentColumns} data={recentPayments} striped hoverable />
          ) : (
            <p style={{ textAlign: 'center', color: '#999', padding: '24px' }}>No payment history yet</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MemberDashboard;
