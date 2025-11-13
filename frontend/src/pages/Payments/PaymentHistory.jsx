import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { usePayments } from '../../hooks/usePayments';
import { useGroups } from '../../hooks/useGroups';
import { useAuth } from '../../hooks/useAuth';
import PaymentHistoryTable from '../../components/features/payments/PaymentHistory/PaymentHistoryTable';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { 
    payments, 
    loading, 
    fetchGroupPayments, 
    fetchMemberPayments 
  } = usePayments();
  const { fetchGroupById, currentGroup } = useGroups();
  
  const groupId = searchParams.get('groupId');
  const memberId = searchParams.get('memberId');
  
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchGroupPayments(groupId);
    } else if (memberId) {
      fetchMemberPayments(memberId);
    }
  }, [groupId, memberId, fetchGroupById, fetchGroupPayments, fetchMemberPayments]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    if (groupId) {
      const statusMap = {
        0: undefined, // All
        1: 'pending',
        2: 'confirmed',
        3: 'late'
      };
      fetchGroupPayments(groupId, { status: statusMap[newValue] });
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Payment History
            </Typography>
            {currentGroup && (
              <Typography variant="body2" color="text.secondary">
                {currentGroup.name}
              </Typography>
            )}
          </Box>
        </Box>
        
        {groupId && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleRecordPayment}
          >
            Record Payment
          </Button>
        )}
      </Box>

      {/* Tabs */}
      {groupId && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="All Payments" />
            <Tab label="Pending" />
            <Tab label="Confirmed" />
            <Tab label="Late" />
          </Tabs>
        </Box>
      )}

      {/* Payments Table */}
      <Paper elevation={2} sx={{ p: 3 }}>
        {payments.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No payments found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Start by recording your first payment
            </Typography>
            {groupId && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleRecordPayment}
              >
                Record Payment
              </Button>
            )}
          </Box>
        ) : (
          <PaymentHistoryTable 
            payments={payments}
            groupId={groupId}
          />
        )}
      </Paper>
    </Container>
  );
};

export default PaymentHistory;