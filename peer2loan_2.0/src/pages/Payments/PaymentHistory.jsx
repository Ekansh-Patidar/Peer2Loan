import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Loader, Alert } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import { usePayments } from '../../hooks/usePayments';
import { useGroups } from '../../hooks/useGroups';
import PaymentHistoryTable from '../../components/features/payments/PaymentHistory/PaymentHistoryTable';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { 
    payments, 
    loading, 
    fetchGroupPayments, 
    fetchMemberPayments 
  } = usePayments();
  const { fetchGroupById, currentGroup } = useGroups();
  
  const groupId = searchParams.get('groupId');
  const memberId = searchParams.get('memberId');
  
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchGroupPayments(groupId);
    } else if (memberId) {
      fetchMemberPayments(memberId);
    }
  }, [groupId, memberId, fetchGroupById, fetchGroupPayments, fetchMemberPayments]);

  const handleTabChange = (status) => {
    setActiveTab(status);
    
    if (groupId) {
      const statusMap = {
        all: undefined,
        pending: 'pending',
        confirmed: 'confirmed',
        late: 'late'
      };
      fetchGroupPayments(groupId, { status: statusMap[status] });
    }
  };

  const handleRecordPayment = () => {
    if (groupId && currentGroup?.currentCycle) {
      navigate(`/payments/record?groupId=${groupId}&cycleId=${currentGroup.currentCycle}`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && payments.length === 0) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading payments..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="payments-dashboard-container">
        {/* Header */}
        <div className="payments-dashboard-header">
          <div>
            <Button variant="outline" onClick={handleBack} style={{ marginBottom: '16px' }}>
              ← Back
            </Button>
            <h1>Payment History</h1>
            {currentGroup && (
              <p className="payments-dashboard-subtitle">{currentGroup.name}</p>
            )}
          </div>
          
          {groupId && (
            <Button variant="primary" onClick={handleRecordPayment}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Record Payment
            </Button>
          )}
        </div>

        {/* Tabs */}
        {groupId && (
          <Card>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                variant={activeTab === 'all' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => handleTabChange('all')}
              >
                All Payments
              </Button>
              <Button
                variant={activeTab === 'pending' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => handleTabChange('pending')}
              >
                Pending
              </Button>
              <Button
                variant={activeTab === 'confirmed' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => handleTabChange('confirmed')}
              >
                Confirmed
              </Button>
              <Button
                variant={activeTab === 'late' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => handleTabChange('late')}
              >
                Late
              </Button>
            </div>
          </Card>
        )}

        {/* Payments Table */}
        <Card title="Payments" subtitle={`${payments.length} payment(s)`}>
          {payments.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '64px', height: '64px', stroke: '#ccc', marginBottom: '16px' }}>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <h3>No payments found</h3>
              <p>Start by recording your first payment</p>
              {groupId && (
                <Button variant="primary" onClick={handleRecordPayment} style={{ marginTop: '16px' }}>
                  Record Payment
                </Button>
              )}
            </div>
          ) : (
            <PaymentHistoryTable 
              payments={payments}
              groupId={groupId}
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PaymentHistory;