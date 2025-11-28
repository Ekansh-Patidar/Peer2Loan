import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Table, Alert, Loader } from '../../components/common';
import ExecutePayoutModal from '../../components/features/payouts/ExecutePayoutModal';
import useAuth from '../../hooks/useAuth';
import usePayouts from '../../hooks/usePayouts';
import { useGroups } from '../../hooks/useGroups';
import api from '../../services/api';
import '../Groups/Groups.css';

/**
 * PayoutsDashboard - Payouts management page
 */
const PayoutsDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { payouts, loading, error, executePayout } = usePayouts();
  const { groups, loadGroups } = useGroups();
  const [filterStatus, setFilterStatus] = useState('all');
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [cyclesReadyForPayout, setCyclesReadyForPayout] = useState([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [allPayouts, setAllPayouts] = useState([]);

  // Fetch groups on mount
  useEffect(() => {
    console.log('Loading groups...');
    loadGroups();
  }, [loadGroups]);

  // Fetch cycles ready for payout
  useEffect(() => {
    const fetchReadyCycles = async () => {
      // Wait for groups to load
      if (!groups) {
        console.log('Groups not loaded yet, waiting...');
        return;
      }
      
      if (groups.length === 0) {
        console.log('No groups available');
        setCyclesReadyForPayout([]);
        return;
      }
      
      console.log('Fetching ready cycles for', groups.length, 'groups');
      setLoadingCycles(true);
      try {
        const readyCycles = [];
        
        for (const group of groups) {
          console.log('Checking group:', group.name, 'status:', group.status);
          if (group.status === 'active') {
            const response = await api.get(`/dashboard/group/${group._id}`);
            const activeCycle = response.data?.activeCycle;
            
            console.log('Active cycle for', group.name, ':', activeCycle);
            console.log('  isReadyForPayout:', activeCycle?.isReadyForPayout);
            console.log('  isPayoutCompleted:', activeCycle?.isPayoutCompleted);
            
            if (activeCycle && activeCycle.isReadyForPayout && !activeCycle.isPayoutCompleted) {
              console.log('✅ Adding cycle to ready list');
              readyCycles.push({
                ...activeCycle,
                groupName: group.name,
                groupId: group._id,
              });
            }
          }
        }
        
        console.log('Total ready cycles:', readyCycles.length);
        setCyclesReadyForPayout(readyCycles);
      } catch (err) {
        console.error('Failed to fetch ready cycles:', err);
      } finally {
        setLoadingCycles(false);
      }
    };

    // Add a small delay to ensure groups are loaded
    const timer = setTimeout(() => {
      fetchReadyCycles();
    }, 100);

    return () => clearTimeout(timer);
  }, [groups]);

  // Fetch all payouts from all groups
  useEffect(() => {
    const fetchAllPayouts = async () => {
      if (!groups || groups.length === 0) return;
      
      try {
        const allPayoutsData = [];
        
        for (const group of groups) {
          const response = await api.get(`/payouts/group/${group._id}`);
          const groupPayouts = response.data?.payouts || [];
          allPayoutsData.push(...groupPayouts);
        }
        
        setAllPayouts(allPayoutsData);
      } catch (err) {
        console.error('Failed to fetch payouts:', err);
      }
    };

    fetchAllPayouts();
  }, [groups]);

  const handleExecutePayout = (cycle, group) => {
    setSelectedCycle(cycle);
    setSelectedGroup(group);
    setShowExecuteModal(true);
  };

  const handlePayoutSuccess = () => {
    // Refresh data
    window.location.reload();
  };

  if (loading || loadingCycles) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading payouts..." />
        </div>
      </DashboardLayout>
    );
  }

  const payoutList = Array.isArray(allPayouts) ? allPayouts : [];
  const filteredPayouts = payoutList.filter((payout) =>
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
                {new Date(record.completedAt || record.processedAt).toLocaleDateString()}
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
      title: 'Transfer Mode',
      dataIndex: 'transferMode',
      key: 'transferMode',
      render: (mode) => (
        <span style={{ textTransform: 'capitalize', fontSize: '13px', color: '#666' }}>
          {mode?.replace('_', ' ') || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="small"
            variant="outline"
            onClick={() => navigate(`/payouts/${record._id}`)}
          >
            View Details
          </Button>
        </div>
      ),
    },
  ];

  // Calculate stats
  const stats = {
    totalPayouts: payoutList.length,
    completed: payoutList.filter((p) => p.status === 'completed').length,
    scheduled: cyclesReadyForPayout.length,
    processing: payoutList.filter((p) => p.status === 'processing').length,
    totalAmount: payoutList
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {cyclesReadyForPayout.length > 0 && (
              <div style={{ padding: '8px 16px', background: '#fef3c7', borderRadius: '8px', fontSize: '14px', fontWeight: '500', color: '#92400e' }}>
                {cyclesReadyForPayout.length} cycle(s) ready for payout
              </div>
            )}
            <Button
              variant="outline"
              size="small"
              onClick={() => window.location.reload()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', marginRight: '4px' }}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </Button>
          </div>
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

        {/* Cycles Ready for Payout */}
        {cyclesReadyForPayout.length > 0 && (
          <Card title="Cycles Ready for Payout" subtitle="Action required">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {cyclesReadyForPayout.map((cycle) => (
                <div key={cycle._id} className="payment-card">
                  <div className="payment-card-header">
                    <div>
                      <div className="payment-card-group">{cycle.groupName}</div>
                      <div className="payment-card-cycle">Cycle {cycle.cycleNumber}</div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: '#d1fae5', color: '#065f46' }}>Ready</span>
                  </div>
                  <div className="payment-card-body">
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      Beneficiary: <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{cycle.beneficiary}</span>
                    </div>
                    <div className="payment-card-amount">₹{cycle.collectedAmount?.toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                      {cycle.paidCount}/{cycle.paidCount + cycle.pendingCount} members paid
                    </div>
                  </div>
                  <div className="payment-card-footer">
                    <Button
                      variant="success"
                      size="small"
                      style={{ width: '100%' }}
                      onClick={() => {
                        const group = groups.find(g => g._id === cycle.groupId);
                        handleExecutePayout(cycle, group);
                      }}
                    >
                      Execute Payout
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

        {/* Execute Payout Modal */}
        {showExecuteModal && (
          <ExecutePayoutModal
            isOpen={showExecuteModal}
            onClose={() => {
              setShowExecuteModal(false);
              setSelectedCycle(null);
              setSelectedGroup(null);
            }}
            cycle={selectedCycle}
            group={selectedGroup}
            onSuccess={handlePayoutSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default PayoutsDashboard;
