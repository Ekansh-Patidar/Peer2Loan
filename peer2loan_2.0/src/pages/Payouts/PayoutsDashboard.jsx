import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Table, Alert, Loader } from '../../components/common';
import ProcessPayoutModal from '../../components/features/payouts/ProcessPayoutModal';
import CompletePayoutModal from '../../components/features/payouts/CompletePayoutModal';
import PayoutDetailsModal from '../../components/features/payouts/PayoutDetailsModal';
import useAuth from '../../hooks/useAuth';
import { useGroups } from '../../hooks/useGroups';
import payoutService from '../../services/payoutService';
import api from '../../services/api';
import razorpayService from '../../services/razorpayService';
import '../Groups/Groups.css';

/**
 * PayoutsDashboard - Payouts management page with approval workflow
 */
const PayoutsDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { groups, loadGroups } = useGroups();
  const [filterStatus, setFilterStatus] = useState('all');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [cyclesReadyForPayout, setCyclesReadyForPayout] = useState([]);
  const [pendingApprovalPayouts, setPendingApprovalPayouts] = useState([]);
  const [approvedPayouts, setApprovedPayouts] = useState([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [allPayouts, setAllPayouts] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [demoPayouts, setDemoPayouts] = useState([]);

  // Generate demo payouts for testing
  const generateDemoPayouts = () => {
    const demoData = [
      {
        _id: 'demo_payout_' + Date.now() + '_1',
        group: { _id: 'demo_group_1', name: 'Family Savings Pool' },
        cycle: { _id: 'demo_cycle_1', cycleNumber: 2 },
        beneficiary: { 
          _id: 'demo_member_1', 
          user: { _id: 'demo_user_1', name: 'John Doe' } 
        },
        amount: 50000,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        initiatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'demo_payout_' + Date.now() + '_2',
        group: { _id: 'demo_group_2', name: 'Office Chit Fund' },
        cycle: { _id: 'demo_cycle_2', cycleNumber: 4 },
        beneficiary: { 
          _id: 'demo_member_2', 
          user: { _id: 'demo_user_2', name: 'Jane Smith' } 
        },
        amount: 100000,
        status: 'pending_approval',
        initiatedAt: new Date().toISOString(),
      },
    ];
    setDemoPayouts(demoData);
    setSuccessMessage('Demo payouts added! You can now test the Razorpay integration.');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Handle demo payout success (update demo payout status)
  const handleDemoPayoutSuccess = (payoutId) => {
    setDemoPayouts(prev => prev.map(p => 
      p._id === payoutId 
        ? { ...p, status: 'completed', completedAt: new Date().toISOString() }
        : p
    ));
  };

  // Check for completed demo payout on mount (from callback)
  useEffect(() => {
    const completedDemoPayoutId = sessionStorage.getItem('completed_demo_payout');
    if (completedDemoPayoutId) {
      handleDemoPayoutSuccess(completedDemoPayoutId);
      sessionStorage.removeItem('completed_demo_payout');
      setSuccessMessage('Payout completed successfully! Stats have been updated.');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, []);

  // Fetch groups on mount
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Track which groups user is organizer of
  const [organizerGroupIds, setOrganizerGroupIds] = useState([]);

  // Fetch cycles ready for payout and all payouts
  useEffect(() => {
    const fetchData = async () => {
      if (!groups || groups.length === 0) return;
      
      setLoadingCycles(true);
      try {
        const readyCycles = [];
        const allPayoutsData = [];
        const pendingApproval = [];
        const approved = [];
        const orgGroupIds = [];
        
        for (const group of groups) {
          // Check if current user is the organizer of this group
          const isOrganizer = group.organizer === user?._id || group.organizer?._id === user?._id;
          if (isOrganizer) {
            orgGroupIds.push(group._id);
          }
          
          // Get all payouts for this group first
          const payoutsResponse = await api.get(`/payouts/group/${group._id}`);
          const groupPayouts = payoutsResponse.data?.payouts || [];
          allPayoutsData.push(...groupPayouts);
          
          // Categorize payouts (only for organizer)
          if (isOrganizer) {
            groupPayouts.forEach(payout => {
              if (payout.status === 'pending_approval') {
                pendingApproval.push(payout);
              } else if (payout.status === 'approved') {
                approved.push(payout);
              }
            });
          }
          
          if (group.status === 'active' && isOrganizer) {
            // Get dashboard data for active cycle
            const response = await api.get(`/dashboard/group/${group._id}`);
            const activeCycle = response.data?.activeCycle;
            
            // Check if there's already a payout for this cycle (any status except scheduled)
            const existingPayout = groupPayouts.find(p => 
              p.cycle?._id === activeCycle?._id || p.cycle === activeCycle?._id
            );
            const hasActivePayout = existingPayout && existingPayout.status !== 'scheduled';
            
            // Show ALL active cycles for payout processing
            // Admin can process payout regardless of payment status
            // Members who haven't paid will get late fees applied
            if (activeCycle && !activeCycle.isPayoutCompleted && !hasActivePayout) {
              // Calculate total members from the cycle data
              const paidCount = activeCycle.paidCount || 0;
              const pendingCount = activeCycle.pendingCount || 0;
              const lateCount = activeCycle.lateCount || 0;
              const totalMembers = paidCount + pendingCount + lateCount;
              
              // Only consider "All Paid" if there are members and all have paid
              const isFullyPaid = totalMembers > 0 && paidCount >= totalMembers;
              
              readyCycles.push({
                ...activeCycle,
                groupName: group.name,
                groupId: group._id,
                isFullyPaid: isFullyPaid,
                totalMembers: totalMembers || group.memberCount,
                paidCount: paidCount,
                pendingCount: pendingCount,
              });
            }
          }
        }
        
        setOrganizerGroupIds(orgGroupIds);
        setCyclesReadyForPayout(readyCycles);
        setAllPayouts(allPayoutsData);
        setPendingApprovalPayouts(pendingApproval);
        setApprovedPayouts(approved);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load payout data');
      } finally {
        setLoadingCycles(false);
      }
    };

    const timer = setTimeout(() => fetchData(), 100);
    return () => clearTimeout(timer);
  }, [groups, user]);

  // Fetch pending payouts for current user (as beneficiary)
  const [myPendingPayouts, setMyPendingPayouts] = useState([]);
  useEffect(() => {
    const fetchMyPendingPayouts = async () => {
      try {
        const response = await payoutService.getPendingPayouts();
        setMyPendingPayouts(response.payouts || []);
      } catch (err) {
        console.error('Failed to fetch pending payouts:', err);
      }
    };
    fetchMyPendingPayouts();
  }, []);

  const handleProcessPayout = (cycle, group) => {
    setSelectedCycle(cycle);
    setSelectedGroup(group);
    setShowProcessModal(true);
  };

  const handleCompletePayout = (payout) => {
    setSelectedPayout(payout);
    setShowCompleteModal(true);
  };

  const handleViewDetails = (payout) => {
    setSelectedPayout(payout);
    setShowDetailsModal(true);
  };

  const handleApprovePayout = async (payout) => {
    try {
      await payoutService.approvePayout(payout._id);
      setSuccessMessage('Payout approved successfully! Admin has been notified.');
      // Refresh data
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Failed to approve payout');
    }
  };

  const handleSuccess = (message) => {
    setSuccessMessage(message);
    window.location.reload();
  };

  if (loadingCycles) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading payouts..." />
        </div>
      </DashboardLayout>
    );
  }

  // Combine real payouts with demo payouts
  const payoutList = [...(Array.isArray(allPayouts) ? allPayouts : []), ...demoPayouts];
  const filteredPayouts = payoutList.filter((payout) =>
    filterStatus === 'all' ? true : payout.status === filterStatus
  );
  
  // Also add demo approved payouts to the approvedPayouts list for display
  const allApprovedPayouts = [
    ...approvedPayouts, 
    ...demoPayouts.filter(p => p.status === 'approved')
  ];

  const getStatusBadge = (status) => {
    const colors = {
      completed: { bg: '#e8f5e9', color: '#2e7d32' },
      scheduled: { bg: '#e3f2fd', color: '#1976d2' },
      pending_approval: { bg: '#fff3e0', color: '#f57c00' },
      approved: { bg: '#e8f5e9', color: '#388e3c' },
      processing: { bg: '#fff3e0', color: '#f57c00' },
      failed: { bg: '#ffebee', color: '#c62828' },
      skipped: { bg: '#f5f5f5', color: '#666' },
    };
    const style = colors[status] || colors.scheduled;
    const labels = {
      pending_approval: 'Pending Approval',
      approved: 'Approved',
    };
    return (
      <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', background: style.bg, color: style.color }}>
        {labels[status] || status}
      </span>
    );
  };


  const columns = [
    {
      title: 'Group & Cycle',
      key: 'group',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{record.group?.name || 'Unknown'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Cycle {record.cycle?.cycleNumber || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (_, record) => (
        <div style={{ fontWeight: '500', color: '#1a1a1a' }}>
          {record.beneficiary?.user?.name || 'Unknown'}
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span style={{ fontWeight: '600', fontSize: '16px', color: '#4caf50' }}>
          ₹{amount?.toLocaleString()}
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
              <div style={{ fontSize: '13px', color: '#666' }}>Completed</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {new Date(record.completedAt).toLocaleDateString()}
              </div>
            </div>
          );
        }
        if (record.status === 'approved') {
          return (
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Approved</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {new Date(record.approvedAt).toLocaleDateString()}
              </div>
            </div>
          );
        }
        if (record.status === 'pending_approval') {
          return (
            <div>
              <div style={{ fontSize: '13px', color: '#666' }}>Initiated</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {new Date(record.initiatedAt).toLocaleDateString()}
              </div>
            </div>
          );
        }
        return (
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Scheduled</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {new Date(record.scheduledDate).toLocaleDateString()}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isOrganizer = organizerGroupIds.includes(record.group?._id);
        const isBeneficiary = record.beneficiary?.user?._id === user?._id || record.beneficiary?.user === user?._id;
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            {record.status === 'approved' && isOrganizer && (
              <>
                <Button 
                  size="small" 
                  variant="primary" 
                  onClick={() => {
                    razorpayService.initiatePayment({
                      amount: record.amount,
                      paymentId: record._id,
                      memberName: record.beneficiary?.user?.name || 'Beneficiary',
                      description: `Payout for ${record.group?.name || 'Group'} - Cycle ${record.cycle?.cycleNumber || ''}`,
                      type: 'payout',
                      groupName: record.group?.name || 'Group',
                      cycleNumber: record.cycle?.cycleNumber || '',
                    });
                  }}
                >
                  Pay via Razorpay
                </Button>
                <Button size="small" variant="success" onClick={() => handleCompletePayout(record)}>
                  Complete Payout
                </Button>
              </>
            )}
            {record.status === 'completed' && (
              <Button size="small" variant="outline" onClick={() => handleViewDetails(record)}>
                View Details
              </Button>
            )}
            {record.status === 'pending_approval' && (
              <Button size="small" variant="outline" onClick={() => handleViewDetails(record)}>
                View
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Calculate stats (including demo payouts)
  const stats = {
    totalPayouts: payoutList.length,
    completed: payoutList.filter((p) => p.status === 'completed').length,
    readyForPayout: cyclesReadyForPayout.length,
    pendingApproval: payoutList.filter((p) => p.status === 'pending_approval').length,
    approved: allApprovedPayouts.length,
    totalAmount: payoutList.filter((p) => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="payments-dashboard-container">
        {/* Header */}
        <div className="payments-dashboard-header">
          <div>
            <h1>Payouts</h1>
            <p className="payments-dashboard-subtitle">Manage group payouts with approval workflow</p>
          </div>
          <Button variant="outline" size="small" onClick={() => window.location.reload()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', marginRight: '4px' }}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </Button>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" closable onClose={() => setError(null)}>{error}</Alert>}
        {successMessage && <Alert type="success" closable onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}

        {/* Demo Button - Always visible for testing */}
        {demoPayouts.length === 0 && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#666', margin: 0 }}>
                  Test Razorpay integration with demo payouts
                </p>
              </div>
              <Button variant="primary" onClick={generateDemoPayouts}>
                Add Demo Payouts
              </Button>
            </div>
          </Card>
        )}

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
                <div className="stat-label">Completed</div>
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-subtext">₹{stats.totalAmount.toLocaleString()} disbursed</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Ready to Process</div>
                <div className="stat-value">{stats.readyForPayout}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon yellow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Pending Approval</div>
                <div className="stat-value">{stats.pendingApproval}</div>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="stat-card">
              <div className="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Approved (Ready to Complete)</div>
                <div className="stat-value">{stats.approved}</div>
              </div>
            </div>
          </Card>
        </div>


        {/* My Pending Approvals (for beneficiaries) */}
        {myPendingPayouts.length > 0 && (
          <Card title="🔔 Action Required: Approve Your Payout" subtitle="You have payouts waiting for your approval">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {myPendingPayouts.map((payout) => (
                <div key={payout._id} className="payment-card" style={{ border: '2px solid #f59e0b', background: '#fffbeb' }}>
                  <div className="payment-card-header">
                    <div>
                      <div className="payment-card-group">{payout.group?.name}</div>
                      <div className="payment-card-cycle">Cycle {payout.cycle?.cycleNumber}</div>
                    </div>
                    {getStatusBadge('pending_approval')}
                  </div>
                  <div className="payment-card-body">
                    <div className="payment-card-amount">₹{payout.amount?.toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                      Initiated: {new Date(payout.initiatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="payment-card-footer">
                    <Button variant="success" size="small" style={{ width: '100%' }} onClick={() => handleApprovePayout(payout)}>
                      ✓ Approve Payout
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Active Cycles for Payout (Admin only) */}
        {cyclesReadyForPayout.length > 0 && organizerGroupIds.length > 0 && (
          <Card title="Active Cycles - Process Payout" subtitle="Process payout for active cycles. Members who haven't paid will receive late fees.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {cyclesReadyForPayout.map((cycle) => (
                <div key={cycle._id} className="payment-card">
                  <div className="payment-card-header">
                    <div>
                      <div className="payment-card-group">{cycle.groupName}</div>
                      <div className="payment-card-cycle">Cycle {cycle.cycleNumber}</div>
                    </div>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      background: cycle.isFullyPaid ? '#d1fae5' : '#e0e7ff', 
                      color: cycle.isFullyPaid ? '#065f46' : '#3730a3' 
                    }}>
                      {cycle.isFullyPaid ? 'All Paid' : 'Active'}
                    </span>
                  </div>
                  <div className="payment-card-body">
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      Beneficiary: <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{cycle.beneficiary}</span>
                    </div>
                    <div className="payment-card-amount">₹{cycle.collectedAmount?.toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                      {cycle.paidCount || 0}/{cycle.totalMembers || (cycle.paidCount + cycle.pendingCount)} members paid
                    </div>
                  </div>
                  <div className="payment-card-footer">
                    <Button variant="primary" size="small" style={{ width: '100%' }} onClick={() => {
                      const group = groups.find(g => g._id === cycle.groupId);
                      handleProcessPayout(cycle, group);
                    }}>
                      Process Payout
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Demo Data Button - Show when no payouts */}
        {payoutList.length === 0 && !loadingCycles && (
          <Card>
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                No payouts found. Add demo payouts to test the Razorpay integration.
              </p>
              <Button variant="primary" onClick={generateDemoPayouts}>
                Add Demo Payouts
              </Button>
            </div>
          </Card>
        )}

        {/* Approved Payouts - Ready to Complete (Admin only or demo) */}
        {allApprovedPayouts.length > 0 && (
          <Card title="✅ Approved Payouts - Ready to Complete" subtitle="Beneficiaries have approved. Complete the transfer and upload proof.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {allApprovedPayouts.map((payout) => (
                <div key={payout._id} className="payment-card" style={{ border: '2px solid #10b981', background: '#ecfdf5' }}>
                  <div className="payment-card-header">
                    <div>
                      <div className="payment-card-group">{payout.group?.name}</div>
                      <div className="payment-card-cycle">Cycle {payout.cycle?.cycleNumber}</div>
                    </div>
                    {getStatusBadge('approved')}
                  </div>
                  <div className="payment-card-body">
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      Beneficiary: <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{payout.beneficiary?.user?.name}</span>
                    </div>
                    <div className="payment-card-amount">₹{payout.amount?.toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                      Approved: {new Date(payout.approvedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="payment-card-footer" style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      variant="primary" 
                      size="small" 
                      style={{ flex: 1 }} 
                      onClick={() => {
                        razorpayService.initiatePayment({
                          amount: payout.amount,
                          paymentId: payout._id,
                          memberName: payout.beneficiary?.user?.name || 'Beneficiary',
                          description: `Payout for ${payout.group?.name || 'Group'} - Cycle ${payout.cycle?.cycleNumber || ''}`,
                          type: 'payout',
                          groupName: payout.group?.name || 'Group',
                          cycleNumber: payout.cycle?.cycleNumber || '',
                        });
                      }}
                    >
                      Pay via Razorpay
                    </Button>
                    <Button variant="success" size="small" style={{ flex: 1 }} onClick={() => handleCompletePayout(payout)}>
                      Complete Payout
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
            <Button variant={filterStatus === 'all' ? 'primary' : 'ghost'} size="small" onClick={() => setFilterStatus('all')}>All</Button>
            <Button variant={filterStatus === 'scheduled' ? 'primary' : 'ghost'} size="small" onClick={() => setFilterStatus('scheduled')}>Scheduled</Button>
            <Button variant={filterStatus === 'pending_approval' ? 'primary' : 'ghost'} size="small" onClick={() => setFilterStatus('pending_approval')}>Pending Approval</Button>
            <Button variant={filterStatus === 'approved' ? 'primary' : 'ghost'} size="small" onClick={() => setFilterStatus('approved')}>Approved</Button>
            <Button variant={filterStatus === 'completed' ? 'primary' : 'ghost'} size="small" onClick={() => setFilterStatus('completed')}>Completed</Button>
            <Button variant={filterStatus === 'failed' ? 'primary' : 'ghost'} size="small" onClick={() => setFilterStatus('failed')}>Failed</Button>
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

        {/* Modals */}
        {showProcessModal && (
          <ProcessPayoutModal
            isOpen={showProcessModal}
            onClose={() => { setShowProcessModal(false); setSelectedCycle(null); setSelectedGroup(null); }}
            cycle={selectedCycle}
            group={selectedGroup}
            onSuccess={() => handleSuccess('Payout initiated! Beneficiary has been notified for approval.')}
          />
        )}

        {showCompleteModal && (
          <CompletePayoutModal
            isOpen={showCompleteModal}
            onClose={() => { setShowCompleteModal(false); setSelectedPayout(null); }}
            payout={selectedPayout}
            onSuccess={() => handleSuccess('Payout completed! Beneficiary has been notified.')}
          />
        )}

        {showDetailsModal && (
          <PayoutDetailsModal
            isOpen={showDetailsModal}
            onClose={() => { setShowDetailsModal(false); setSelectedPayout(null); }}
            payout={selectedPayout}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default PayoutsDashboard;
