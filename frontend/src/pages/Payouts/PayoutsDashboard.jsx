import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Table, Alert, Input } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import '../Groups/Groups.css';

/**
 * PayoutsDashboard - Payouts management page
 * This is a placeholder layout ready for backend integration
 */
const PayoutsDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');

  // Placeholder data - will be replaced with API calls
  const payouts = [
    {
      id: '1',
      groupName: 'Family Savings Group',
      groupId: '1',
      cycleNumber: 2,
      beneficiaryName: 'John Doe',
      beneficiaryId: '1',
      amount: 50000,
      scheduledDate: '2025-10-15',
      status: 'completed',
      completedDate: '2025-10-15',
      paymentMode: 'bank_transfer',
      transactionId: 'TXN123456789',
    },
    {
      id: '2',
      groupName: 'Friends Investment Circle',
      groupId: '2',
      cycleNumber: 5,
      beneficiaryName: 'Jane Smith',
      beneficiaryId: '2',
      amount: 80000,
      scheduledDate: '2025-11-20',
      status: 'scheduled',
      paymentMode: 'upi',
    },
    {
      id: '3',
      groupName: 'Office Colleagues Fund',
      groupId: '3',
      cycleNumber: 1,
      beneficiaryName: 'Alice Brown',
      beneficiaryId: '3',
      amount: 18000,
      scheduledDate: '2025-11-18',
      status: 'processing',
      paymentMode: 'bank_transfer',
    },
    {
      id: '4',
      groupName: 'Family Savings Group',
      groupId: '1',
      cycleNumber: 1,
      beneficiaryName: 'Bob Wilson',
      beneficiaryId: '4',
      amount: 50000,
      scheduledDate: '2025-09-15',
      status: 'failed',
      failureReason: 'Insufficient funds in group account',
      paymentMode: 'bank_transfer',
    },
  ];

  const filteredPayouts = payouts.filter((payout) =>
    filterStatus === 'all' ? true : payout.status === filterStatus
  );

  const getStatusBadge = (status) => {
    const colors = {
      completed: { bg: '#e8f5e9', color: '#2e7d32' },
      scheduled: { bg: '#e3f2fd', color: '#1976d2' },
      processing: { bg: '#fff3e0', color: '#f57c00' },
      failed: { bg: '#ffebee', color: '#c62828' },
      skipped: { bg: '#f5f5f5', color: '#666' },
    };
    const style = colors[status] || colors.scheduled;
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
      title: 'Group & Cycle',
      key: 'group',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{record.groupName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Cycle {record.cycleNumber}</div>
        </div>
      ),
    },
    {
      title: 'Beneficiary',
      dataIndex: 'beneficiaryName',
      key: 'beneficiaryName',
      render: (name) => (
        <div style={{ fontWeight: '500', color: '#1a1a1a' }}>{name}</div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span style={{ fontWeight: '600', fontSize: '16px', color: '#4caf50' }}>
          ₹{amount.toLocaleString()}
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
        if (record.status === 'completed') {
          return (
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Completed on</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {new Date(record.completedDate).toLocaleDateString()}
              </div>
            </div>
          );
        }
        return (
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Scheduled for</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {new Date(record.scheduledDate).toLocaleDateString()}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Payment Mode',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      render: (mode) => (
        <span style={{ textTransform: 'capitalize', fontSize: '13px', color: '#666' }}>
          {mode.replace('_', ' ')}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {record.status === 'scheduled' && (
            <Button
              size="small"
              variant="success"
              onClick={() => alert('Process payout feature coming soon!')}
            >
              Process
            </Button>
          )}
          {record.status === 'failed' && (
            <Button
              size="small"
              variant="warning"
              onClick={() => alert('Retry payout feature coming soon!')}
            >
              Retry
            </Button>
          )}
          <Button
            size="small"
            variant="outline"
            onClick={() => alert('View details coming soon!')}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  // Calculate stats
  const stats = {
    totalPayouts: payouts.length,
    completed: payouts.filter((p) => p.status === 'completed').length,
    scheduled: payouts.filter((p) => p.status === 'scheduled').length,
    processing: payouts.filter((p) => p.status === 'processing').length,
    totalAmount: payouts
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="payments-dashboard-container">
        {/* Header */}
        <div className="payments-dashboard-header">
          <div>
            <h1>Payouts</h1>
            <p className="payments-dashboard-subtitle">Manage group payouts and disbursements</p>
          </div>
          <Button variant="primary" onClick={() => alert('Schedule payout feature coming soon!')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Schedule Payout
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
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Completed Payouts</div>
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-subtext">₹{stats.totalAmount.toLocaleString()} disbursed</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Scheduled</div>
                <div className="stat-value">{stats.scheduled}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon yellow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Processing</div>
                <div className="stat-value">{stats.processing}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Payouts</div>
                <div className="stat-value">{stats.totalPayouts}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Scheduled Payouts Cards */}
        {stats.scheduled > 0 && (
          <Card title="Upcoming Payouts" subtitle="Action required">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {payouts
                .filter((p) => p.status === 'scheduled')
                .map((payout) => (
                  <div key={payout.id} className="payment-card">
                    <div className="payment-card-header">
                      <div>
                        <div className="payment-card-group">{payout.groupName}</div>
                        <div className="payment-card-cycle">Cycle {payout.cycleNumber}</div>
                      </div>
                      {getStatusBadge(payout.status)}
                    </div>
                    <div className="payment-card-body">
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                        Beneficiary: <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{payout.beneficiaryName}</span>
                      </div>
                      <div className="payment-card-amount">₹{payout.amount.toLocaleString()}</div>
                      <div className="payment-card-due">
                        Scheduled: {new Date(payout.scheduledDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="payment-card-footer">
                      <Button
                        variant="success"
                        size="small"
                        style={{ width: '100%' }}
                        onClick={() => alert('Process payout feature coming soon!')}
                      >
                        Process Payout
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
              variant={filterStatus === 'scheduled' ? 'primary' : 'ghost'}
              size="small"
              onClick={() => setFilterStatus('scheduled')}
            >
              Scheduled
            </Button>
            <Button
              variant={filterStatus === 'processing' ? 'primary' : 'ghost'}
              size="small"
              onClick={() => setFilterStatus('processing')}
            >
              Processing
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'primary' : 'ghost'}
              size="small"
              onClick={() => setFilterStatus('completed')}
            >
              Completed
            </Button>
            <Button
              variant={filterStatus === 'failed' ? 'primary' : 'ghost'}
              size="small"
              onClick={() => setFilterStatus('failed')}
            >
              Failed
            </Button>
          </div>
        </Card>

        {/* Payouts Table */}
        <Card title="Payout History" subtitle={`${filteredPayouts.length} payout(s)`}>
          {filteredPayouts.length > 0 ? (
            <Table columns={columns} data={filteredPayouts} striped hoverable />
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '64px', height: '64px', stroke: '#ccc', marginBottom: '16px' }}>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <h3>No payouts found</h3>
              <p>Payout history will appear here</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PayoutsDashboard;
