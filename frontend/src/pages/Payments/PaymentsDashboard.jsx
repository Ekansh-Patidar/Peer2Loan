import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Table, Alert, Loader } from '../../components/common';
import { RecordPaymentModal, PaymentApprovalModal, PaymentDetailsModal } from '../../components/features/payments';
import useAuth from '../../hooks/useAuth';
import { usePayments } from '../../hooks/usePayments';
import { useGroups } from '../../hooks/useGroups';
import api from '../../services/api';
import '../Groups/Groups.css';

/**
 * PaymentsDashboard - Main payments management page
 */
const PaymentsDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { payments = [], loading, error, fetchMyPayments } = usePayments();
  const { groups } = useGroups();
  const [filterStatus, setFilterStatus] = useState('all');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [pendingApprovalPayments, setPendingApprovalPayments] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApprovalPayment, setSelectedApprovalPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetailsPayment, setSelectedDetailsPayment] = useState(null);
  const [organizerGroupIds, setOrganizerGroupIds] = useState([]);

  // Load groups on mount
  const { loadGroups } = useGroups();
  
  useEffect(() => {
    if (user?._id) {
      // Fetch payments for the current user
      fetchMyPayments();
      // Load groups to check for organizer status
      loadGroups();
    }
  }, [user, fetchMyPayments, loadGroups]);

  // Fetch pending approval payments for admin
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      if (!user?._id) return;
      
      try {
        // If groups not loaded yet, fetch them directly
        let groupsToCheck = groups;
        if (!groupsToCheck || groupsToCheck.length === 0) {
          const response = await api.get('/groups');
          groupsToCheck = response.data?.groups || [];
        }
        
        if (groupsToCheck.length === 0) return;
        
        const orgGroupIds = [];
        const pendingPayments = [];
        
        for (const group of groupsToCheck) {
          const isOrganizer = group.organizer === user?._id || group.organizer?._id === user?._id;
          if (isOrganizer) {
            orgGroupIds.push(group._id);
            
            // Fetch payments for this group with under_review status
            const response = await api.get(`/payments/group/${group._id}`, {
              params: { status: 'under_review' }
            });
            const groupPayments = response.data?.payments || [];
            pendingPayments.push(...groupPayments);
          }
        }
        
        setOrganizerGroupIds(orgGroupIds);
        setPendingApprovalPayments(pendingPayments);
      } catch (err) {
        console.error('Failed to fetch pending approval payments:', err);
      }
    };
    
    fetchPendingApprovals();
  }, [groups, user]);

  // Check if we should open the modal from URL params
  useEffect(() => {
    const groupId = searchParams.get('groupId');
    const cycleId = searchParams.get('cycleId');
    if (groupId && cycleId) {
      setSelectedPayment({ groupId, cycleId });
      setShowRecordModal(true);
    }
  }, [searchParams]);

  const paymentList = Array.isArray(payments) ? payments : [];
  const filteredPayments = paymentList.filter((payment) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') {
      // Include both pending and under_review as "Pending"
      return payment.status === 'pending' || payment.status === 'under_review';
    }
    if (filterStatus === 'paid') {
      // Include confirmed, paid, and verified as "Paid"
      return payment.status === 'paid' || payment.status === 'confirmed' || payment.status === 'verified';
    }
    return payment.status === filterStatus;
  });

  if (loading && paymentList.length === 0) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading payments..." />
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: '#fff3e0', color: '#f57c00', label: 'Pending' },
      paid: { bg: '#e8f5e9', color: '#2e7d32', label: 'Paid' },
      under_review: { bg: '#fff9c4', color: '#f57f17', label: 'Under Review' },
      verified: { bg: '#c8e6c9', color: '#388e3c', label: 'Verified' },
      confirmed: { bg: '#e8f5e9', color: '#2e7d32', label: 'Paid' },
      rejected: { bg: '#ffebee', color: '#c62828', label: 'Rejected' },
      late: { bg: '#ffebee', color: '#c62828', label: 'Late' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          background: config.bg,
          color: config.color,
        }}
      >
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      title: 'Group',
      key: 'group',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{record.group?.name || 'Unknown'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Cycle {record.cycle?.cycleNumber || 'N/A'}</div>
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
        if (record.status === 'confirmed') {
          return (
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Confirmed on</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {new Date(record.confirmedAt || record.updatedAt).toLocaleDateString()}
              </div>
            </div>
          );
        }
        if (record.status === 'received') {
          return (
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Received on</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {new Date(record.receivedDate || record.createdAt).toLocaleDateString()}
              </div>
            </div>
          );
        }
        return (
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Recorded on</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {new Date(record.createdAt).toLocaleDateString()}
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
          <Button 
            size="small" 
            variant="outline" 
            onClick={() => {
              setSelectedDetailsPayment(record);
              setShowDetailsModal(true);
            }}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  // Calculate stats
  const paidStatuses = ['paid', 'under_review', 'verified', 'confirmed'];
  const stats = {
    totalPending: paymentList.filter((p) => p.status === 'pending' && p.type === 'contribution').length,
    totalPaid: paymentList.filter((p) => paidStatuses.includes(p.status)).length,
    pendingAmount: paymentList
      .filter((p) => p.status === 'pending' && p.type === 'contribution')
      .reduce((sum, p) => sum + p.amount, 0),
    paidAmount: paymentList
      .filter((p) => paidStatuses.includes(p.status))
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
          <Button 
            variant="primary" 
            onClick={() => {
              console.log('Groups:', groups);
              // Always allow opening the modal - it will show group selection
              setShowRecordModal(true);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Record Payment
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" closable>
            {error}
          </Alert>
        )}

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
                <div className="stat-value">{paymentList.length}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Payments Pending Approval (Admin View) */}
        {organizerGroupIds.length > 0 && pendingApprovalPayments.length > 0 && (
          <Card title="Payments Pending Approval" subtitle={`${pendingApprovalPayments.length} payment(s) awaiting your review`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {pendingApprovalPayments.map((payment) => (
                <div key={payment._id} className="payment-card" style={{ border: '2px solid #ff9800' }}>
                  <div className="payment-card-header">
                    <div>
                      <div className="payment-card-group">{payment.group?.name || 'Unknown Group'}</div>
                      <div className="payment-card-cycle">Cycle {payment.cycle?.cycleNumber || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        By: {payment.member?.user?.name || 'Unknown Member'}
                      </div>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="payment-card-body">
                    <div className="payment-card-amount">₹{payment.amount.toLocaleString()}</div>
                    <div className="payment-card-due">
                      Submitted: {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                    {payment.paymentMode && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        Mode: {payment.paymentMode.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="payment-card-footer" style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="primary"
                      size="small"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setSelectedApprovalPayment(payment);
                        setShowApprovalModal(true);
                      }}
                    >
                      Review & Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pending Payments Cards */}
        {stats.totalPending > 0 && (
          <Card title="Pending Payments" subtitle="Action required">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {paymentList
                .filter((p) => p.status === 'pending' && p.type === 'contribution')
                .map((payment) => (
                  <div key={payment._id} className="payment-card">
                    <div className="payment-card-header">
                      <div>
                        <div className="payment-card-group">{payment.group?.name || 'Unknown Group'}</div>
                        <div className="payment-card-cycle">Cycle {payment.cycle?.cycleNumber || 'N/A'}</div>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="payment-card-body">
                      <div className="payment-card-amount">₹{payment.amount.toLocaleString()}</div>
                      <div className="payment-card-due">
                        Due: {new Date(payment.dueDate || payment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="payment-card-footer">
                      <Button
                        variant="success"
                        size="small"
                        style={{ width: '100%' }}
                        onClick={() => navigate(`/payments/record?groupId=${payment.group?._id}&cycleId=${payment.cycle?._id}`)}
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

        {/* Record Payment Modal */}
        {showRecordModal && (
          <RecordPaymentModal
            isOpen={showRecordModal}
            onClose={() => {
              setShowRecordModal(false);
              setSelectedPayment(null);
              // Clear URL params if they exist
              if (searchParams.get('groupId')) {
                navigate('/payments', { replace: true });
              }
            }}
            groupId={selectedPayment?.groupId}
            cycleId={selectedPayment?.cycleId}
            amount={selectedPayment?.amount}
            onSuccess={(payment) => {
              alert('Payment recorded successfully!');
              fetchMyPayments();
            }}
          />
        )}

        {/* Payment Approval Modal */}
        {showApprovalModal && selectedApprovalPayment && (
          <PaymentApprovalModal
            isOpen={showApprovalModal}
            onClose={() => {
              setShowApprovalModal(false);
              setSelectedApprovalPayment(null);
            }}
            payment={selectedApprovalPayment}
            onSuccess={() => {
              // Refresh pending approvals
              const fetchPendingApprovals = async () => {
                try {
                  const pendingPayments = [];
                  for (const groupId of organizerGroupIds) {
                    const response = await api.get(`/payments/group/${groupId}`, {
                      params: { status: 'under_review' }
                    });
                    const groupPayments = response.data?.payments || [];
                    pendingPayments.push(...groupPayments);
                  }
                  setPendingApprovalPayments(pendingPayments);
                } catch (err) {
                  console.error('Failed to refresh pending approvals:', err);
                }
              };
              fetchPendingApprovals();
              fetchMyPayments();
            }}
          />
        )}

        {/* Payment Details Modal */}
        {showDetailsModal && selectedDetailsPayment && (
          <PaymentDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedDetailsPayment(null);
            }}
            payment={selectedDetailsPayment}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentsDashboard;
