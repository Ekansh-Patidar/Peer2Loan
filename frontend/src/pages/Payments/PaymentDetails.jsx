import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { usePayments } from '../../hooks/usePayments';
import { useAuth } from '../../hooks/useAuth';
import PaymentProof from '../../components/features/payments/PaymentProof/PaymentProof';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

const PaymentDetails = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentPayment, 
    loading, 
    fetchPaymentById,
    confirmPayment,
    rejectPayment 
  } = usePayments();
  
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentById(paymentId);
    }
  }, [paymentId, fetchPaymentById]);

  const isAdmin = currentPayment?.group?.organizer === user?._id;
  const canConfirm = isAdmin && currentPayment?.status === 'pending';

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      await confirmPayment(paymentId, {
        adminRemarks: 'Payment verified and confirmed'
      });
    } catch (error) {
      console.error('Failed to confirm payment:', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    
    setRejectLoading(true);
    try {
      await rejectPayment(paymentId, {
        adminRemarks: reason
      });
    } catch (error) {
      console.error('Failed to reject payment:', error);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && !currentPayment) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentPayment) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Payment not found</Alert>
      </Container>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'success',
      rejected: 'error',
      late: 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to History
        </Button>
        
        <Box display="flex" justifyContent="space-between" alignItems="start">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Payment Details
            </Typography>
            <Chip 
              label={currentPayment.status.toUpperCase()} 
              color={getStatusColor(currentPayment.status)}
              size="small"
            />
          </Box>
          
          {canConfirm && (
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={handleConfirm}
                disabled={confirmLoading}
              >
                Confirm
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleReject}
                disabled={rejectLoading}
              >
                Reject
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Payment Information */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Payment Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Amount
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {formatCurrency(currentPayment.amount, currentPayment.group?.currency)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Payment Mode
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {currentPayment.paymentMode?.toUpperCase()}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Payment Date
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatDate(currentPayment.paymentDate)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Transaction ID
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {currentPayment.transactionId || 'N/A'}
            </Typography>
          </Grid>

          {currentPayment.referenceNumber && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Reference Number
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {currentPayment.referenceNumber}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Member Remarks
            </Typography>
            <Typography variant="body1">
              {currentPayment.memberRemarks || 'No remarks'}
            </Typography>
          </Grid>

          {currentPayment.adminRemarks && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Admin Remarks
              </Typography>
              <Typography variant="body1">
                {currentPayment.adminRemarks}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Payment Proof */}
      {currentPayment.paymentProof && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Payment Proof
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <PaymentProof 
            proofUrl={currentPayment.paymentProof}
            paymentId={currentPayment._id}
          />
        </Paper>
      )}

      {/* Timestamps */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Timeline
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Created At
            </Typography>
            <Typography variant="body1">
              {formatDateTime(currentPayment.createdAt)}
            </Typography>
          </Grid>

          {currentPayment.confirmedAt && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Confirmed At
              </Typography>
              <Typography variant="body1">
                {formatDateTime(currentPayment.confirmedAt)}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default PaymentDetails;