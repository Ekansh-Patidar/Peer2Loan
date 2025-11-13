import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Table, Alert, Input } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import '../Groups/Groups.css';

/**
 * PaymentsDashboard - Main payments management page
 * This is a placeholder layout ready for backend integration
 */
const PaymentsDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');

  // Placeholder data - will be replaced with API calls
  const payments = [
    {
      id: '1',
      groupName: 'Family Savings Group',
      cycleNumber: 3,
      amount: 5000,
      dueDate: '2025-11-20',
      status: 'pending',
      type: 'contribution',
    },
    {
      id: '2',
      groupName: 'Friends Investment Circle',
      cycleNumber: 5,
      amount: 10000,
      dueDate: '2025-11-15',
      status: 'paid',
      paidDate: '2025-11-10',
      type: 'contribution',
    },
    {
      id: '3',
      groupName: 'Office Colleagues Fund',
      cycleNumber: 2,
      amount: 3000,
      dueDate: '2025-11-25',
      status: 'pending',
      type: 'contribution',
    },
    {
      id: '4',
      groupName: 'Family Savings Group',
      cycleNumber: 2,
      amount: 50000,
      receivedDate: '2025-10-15',
      status: 'received',
      type: 'payout',
    },
  ];

  const filteredPayments = payments.filter((payment) =>
    filterStatus === 'all' ? true : payment.status === filterStatus
  );

  const getStatusBadge = (status) => {
    const colors = {
      paid: { bg: '#e8f5e9', color: '#2e7d32' },
      pending: { bg: '#fff3e0', color: '#f57c00' },
      late: { bg: '#ffebee', color: '#c62828' },
      received: { bg: '#e3f2fd', color: '#1976d2' },
    };
    const style = colors[status] || colors.pending;
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          background: style.bg,
          color: style.color,
        }}
      >
        {status}
      </span>
    );
  };

  const columns = [
    {
      title: 'Group',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Cycle {record.cycleNumber}</div>
        </div>
      ),
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
            background: type === 'contribution' ? '#e3f2fd' : '#e8f5e9',
            color: type === 'contribution' ? '#1976d2' : '#2e7d32',
          }}
        >
          {type}
        </span>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <span
          style={{
            fontWeight: '600',
            fontSize: '16px',
            color: record.type === 'payout' ? '#4caf50' : '#1a1a1a',
          }}
        >
          {record.type === 'payout' ? '+' : ''}₹{amount.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusBadge(status),
    },
    {
      title: 'Date',
      key: 'date',
      render: (_, record) => {
        if (record.status === 'paid') {
          return (
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Paid on</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {new Date(record.paidDate).toLocaleDateString()}
              </div>
            </div>
          );
        }
        if (record.status === 'received') {
          return (
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Received on</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {new Date(record.receivedDate).toLocaleDateString()}
              </div>
            </div>
          );
        }
        return (
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Due on</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {new Date(record.dueDate).toLocaleDateString()}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {record.status === 'pending' && record.type === 'contribution' && (
            <Button size="small" variant="success" onClick={() => alert('Payment feature coming soon!')}>
              Pay Now
            </Button>
          )}
          <Button size="small" variant="outline" onClick={() => alert('View details coming soon!')}>
            View
          </Button>
        </div>
      ),
    },
  ];

  // Calculate stats
  const stats = {
    totalPending: payments.filter((p) => p.status === 'pending' && p.type === 'contribution').length,
    totalPaid: payments.filter((p) => p.status === 'paid').length,
    pendingAmount: payments
      .filter((p) => p.status === 'pending' && p.type === 'contribution')
      .reduce((sum, p) => sum + p.amount, 0),
    paidAmount: payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="payments-dashboard-container">
        {/* Header */}
        <div className="payments-dashboard-header">
          <div>
            <h1>Payments</h1>
            <p className="payments-dashboard-subtitle">Manage your contributions and payouts</p>
          </div>
          <Button variant="primary" onClick={() => alert('Record payment feature coming soon!')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Record Payment
          </Button>
        </div>

        {/* Info Alert */}
        <Alert type="info">
          This is a placeholder layout. Backend integration will be added by other team members.
        </Alert>

        {/* Stats Cards */}
        <div className="payments-stats-grid">
          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon yellow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Pending Payments</div>
                <div className="stat-value">{stats.totalPending}</div>
                <div className="stat-subtext">₹{stats.pendingAmount.toLocaleString()} due</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Paid This Month</div>
                <div className="stat-value">{stats.totalPaid}</div>
                <div className="stat-subtext">₹{stats.paidAmount.toLocaleString()} paid</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Transactions</div>
                <div className="stat-value">{payments.length}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Payments Cards */}
        {stats.totalPending > 0 && (
          <Card title="Pending Payments" subtitle="Action required">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {payments
                .filter((p) => p.status === 'pending' && p.type === 'contribution')
                .map((payment) => (
                  <div key={payment.id} className="payment-card">
                    <div className="payment-card-header">
                      <div>
                        <div className="payment-card-group">{payment.groupName}</div>
                        <div className="payment-card-cycle">Cycle {payment.cycleNumber}</div>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="payment-card-body">
                      <div className="payment-card-amount">₹{payment.amount.toLocaleString()}</div>
                      <div className="payment-card-due">
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="payment-card-footer">
                      <Button
                        variant="success"
                        size="small"
                        style={{ width: '100%' }}
                        onClick={() => alert('Payment feature coming soon!')}
                      >
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Filter Buttons */}
        <Card>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'ghost'}
              size="small"
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'primary' : 'ghost'}
              size="small"
              onClick={() => setFilterStatus('pending')}
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === 'paid' ? 'primary' : 'ghost'}
              size="small"
              onClick={() => setFilterStatus('paid')}
            >
              Paid
            </Button>
            <Button
              variant={filterStatus === 'received' ? 'primary' : 'ghost'}
              size="small"
              onClick={() => setFilterStatus('received')}
            >
              Payouts
            </Button>
          </div>
        </Card>

        {/* Payments Table */}
        <Card title="Payment History" subtitle={`${filteredPayments.length} transaction(s)`}>
          {filteredPayments.length > 0 ? (
            <Table columns={columns} data={filteredPayments} striped hoverable />
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '64px', height: '64px', stroke: '#ccc', marginBottom: '16px' }}>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <h3>No payments found</h3>
              <p>Your payment history will appear here</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PaymentsDashboard;
