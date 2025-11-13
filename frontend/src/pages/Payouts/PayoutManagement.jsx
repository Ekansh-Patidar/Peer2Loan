import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  MenuItem,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { usePayouts } from '../../hooks/usePayouts';
import { useGroups } from '../../hooks/useGroups';
import { formatCurrency } from '../../utils/formatters';

const TRANSFER_MODES = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' }
];

const PayoutManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { executePayout, loading } = usePayouts();
  const { fetchGroupById, currentGroup, fetchGroupMembers, groupMembers } = useGroups();
  
  const groupId = searchParams.get('groupId');
  const cycleId = searchParams.get('cycleId');
  
  const [formData, setFormData] = useState({
    cycleId: cycleId || '',
    amount: '',
    transferMode: 'bank_transfer',
    transferReference: '',
    transactionId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    recipientAccount: {
      accountType: 'bank',
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: ''
    },
    processorRemarks: ''
  });
  
  const [payoutProofFile, setPayoutProofFile] = useState(null);
  const [error, setError] = useState('');
  const [beneficiary, setBeneficiary] = useState(null);

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchGroupMembers(groupId);
    }
  }, [groupId, fetchGroupById, fetchGroupMembers]);

  useEffect(() => {
    if (currentGroup && groupMembers.length > 0) {
      const currentTurn = currentGroup.currentCycle || 1;
      const currentBeneficiary = groupMembers.find(m => m.turnNumber === currentTurn);
      setBeneficiary(currentBeneficiary);
      
      if (currentGroup.monthlyContribution && currentGroup.memberCount) {
        const totalPot = currentGroup.monthlyContribution * currentGroup.memberCount;
        setFormData(prev => ({
          ...prev,
          amount: totalPot,
          recipientAccount: {
            ...prev.recipientAccount,
            accountHolderName: currentBeneficiary?.user?.name || ''
          }
        }));
      }
    }
  }, [currentGroup, groupMembers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPayoutProofFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const payoutFormData = new FormData();
      
      payoutFormData.append('cycleId', formData.cycleId);
      payoutFormData.append('amount', formData.amount);
      payoutFormData.append('transferMode', formData.transferMode);
      payoutFormData.append('transferReference', formData.transferReference);
      payoutFormData.append('transactionId', formData.transactionId);
      payoutFormData.append('scheduledDate', formData.scheduledDate);
      payoutFormData.append('processorRemarks', formData.processorRemarks);
      payoutFormData.append('recipientAccount', JSON.stringify(formData.recipientAccount));
      
      if (payoutProofFile) {
        payoutFormData.append('payoutProof', payoutProofFile);
      }

      await executePayout(payoutFormData);
      navigate(`/payouts/history?groupId=${groupId}`);
    } catch (err) {
      setError(err.message || 'Failed to execute payout');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!groupId || !cycleId) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Missing group or cycle information</Alert>
      </Container>
    );
  }

  if (loading && !currentGroup) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
        Back
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <AccountBalanceIcon color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">Execute Payout</Typography>
            {currentGroup && (
              <Typography variant="body2" color="text.secondary">
                {currentGroup.name} - Cycle {currentGroup.currentCycle}
              </Typography>
            )}
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {beneficiary && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="medium">
              Beneficiary: {beneficiary.user?.name}
            </Typography>
            <Typography variant="body2">Turn Number: {beneficiary.turnNumber}</Typography>
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" fontWeight="bold" mb={2}>Payout Details</Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payout Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography> }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Scheduled Date"
                name="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Transfer Mode"
                name="transferMode"
                value={formData.transferMode}
                onChange={handleChange}
                required
              >
                {TRANSFER_MODES.map(mode => (
                  <MenuItem key={mode.value} value={mode.value}>{mode.label}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transaction ID"
                name="transactionId"
                value={formData.transactionId}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Transfer Reference"
                name="transferReference"
                value={formData.transferReference}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>

          <Typography variant="h6" fontWeight="bold" mb={2}>Recipient Account Details</Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Holder Name"
                name="recipientAccount.accountHolderName"
                value={formData.recipientAccount.accountHolderName}
                onChange={handleChange}
                required
              />
            </Grid>

            {formData.transferMode === 'bank_transfer' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    name="recipientAccount.accountNumber"
                    value={formData.recipientAccount.accountNumber}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="IFSC Code"
                    name="recipientAccount.ifscCode"
                    value={formData.recipientAccount.ifscCode}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              </>
            )}

            {formData.transferMode === 'upi' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="UPI ID"
                  name="recipientAccount.upiId"
                  value={formData.recipientAccount.upiId}
                  onChange={handleChange}
                  required
                  placeholder="example@upi"
                />
              </Grid>
            )}
          </Grid>

          <Typography variant="h6" fontWeight="bold" mb={2}>Additional Information</Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Processor Remarks"
                name="processorRemarks"
                value={formData.processorRemarks}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <Button variant="outlined" component="label" fullWidth>
                Upload Payout Proof (Optional)
                <input
                  type="file"
                  hidden
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
              </Button>
              {payoutProofFile && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Selected: {payoutProofFile.name}
                </Typography>
              )}
            </Grid>
          </Grid>

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={handleBack} disabled={loading}>
              Cancel
            </Button>
            <Button variant="contained" type="submit" disabled={loading}>
              {loading ? 'Executing...' : 'Execute Payout'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PayoutManagement;