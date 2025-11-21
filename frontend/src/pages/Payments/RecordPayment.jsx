import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import { usePayments } from '../../hooks/usePayments';
import { useGroups } from '../../hooks/useGroups';
import PaymentForm from '../../components/features/payments/PaymentForm/PaymentForm';

const RecordPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { recordPayment, loading } = usePayments();
  const { fetchGroupById, currentGroup } = useGroups();
  
  const groupId = searchParams.get('groupId');
  const cycleId = searchParams.get('cycleId');
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
    }
  }, [groupId, fetchGroupById]);

  const handleSubmit = async (paymentData) => {
    setError('');
    try {
      await recordPayment(paymentData);
      navigate(`/payments/history?groupId=${groupId}`);
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (!groupId || !cycleId) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="error">
          Missing group or cycle information. Please navigate from the dashboard.
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <h1>Record Payment</h1>
          
          {currentGroup && (
            <p style={{ color: '#666', marginBottom: '24px' }}>
              Group: <strong>{currentGroup.name}</strong> • 
              Monthly Contribution: <strong>₹{currentGroup.monthlyContribution}</strong>
            </p>
          )}
          
          {error && (
            <Alert type="error" style={{ marginBottom: '24px' }}>
              {error}
            </Alert>
          )}
          
          <PaymentForm
            groupId={groupId}
            cycleId={cycleId}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RecordPayment;