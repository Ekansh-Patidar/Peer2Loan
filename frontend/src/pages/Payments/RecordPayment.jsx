import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Paper, Typography, Box, Alert } from '@mui/material';
import { usePayments } from '../../hooks/usePayments';
import { useGroups } from '../../hooks/useGroups';
import PaymentForm from '../../components/features/payments/PaymentForm/PaymentForm';

const RecordPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Missing group or cycle information. Please navigate from the dashboard.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Record Payment
        </Typography>
        
        {currentGroup && (
          <Typography variant="body2" color="text.secondary" mb={3}>
            Group: <strong>{currentGroup.name}</strong> • 
            Monthly Contribution: <strong>₹{currentGroup.monthlyContribution}</strong>
          </Typography>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
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
      </Paper>
    </Container>
  );
};

export default RecordPayment;