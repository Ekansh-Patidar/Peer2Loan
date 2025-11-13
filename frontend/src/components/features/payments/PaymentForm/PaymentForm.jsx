import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  Typography,
  Divider,
  Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import './PaymentForm.css';

const PAYMENT_MODES = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' }
];

const PaymentForm = ({ groupId, cycleId, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    groupId: groupId,
    cycleId: cycleId,
    amount: '',
    paymentMode: 'upi',
    transactionId: '',
    referenceNumber: '',
    memberRemarks: ''
  });

  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          paymentProof: 'File size must be less than 5MB'
        }));
        return;
      }

      setPaymentProofFile(file);
      setErrors(prev => ({ ...prev, paymentProof: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.transactionId.trim()) {
      newErrors.transactionId = 'Transaction ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    // Create FormData for file upload
    const paymentData = new FormData();
    
    // Append all form fields
    Object.keys(formData).forEach(key => {
      paymentData.append(key, formData[key]);
    });

    // Append file if exists
    if (paymentProofFile) {
      paymentData.append('paymentProof', paymentProofFile);
    }

    onSubmit(paymentData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className="payment-form">
      {/* Payment Details */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Payment Details
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            error={!!errors.amount}
            helperText={errors.amount}
            required
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Payment Mode"
            name="paymentMode"
            value={formData.paymentMode}
            onChange={handleChange}
            required
          >
            {PAYMENT_MODES.map(mode => (
              <MenuItem key={mode.value} value={mode.value}>
                {mode.label}
              </MenuItem>
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
            error={!!errors.transactionId}
            helperText={errors.transactionId || 'UPI ref no. or transaction ID'}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Reference Number"
            name="referenceNumber"
            value={formData.referenceNumber}
            onChange={handleChange}
            helperText="Optional reference number"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Remarks"
            name="memberRemarks"
            value={formData.memberRemarks}
            onChange={handleChange}
            multiline
            rows={3}
            placeholder="Add any additional notes about this payment"
          />
        </Grid>
      </Grid>

      {/* Payment Proof Upload */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Payment Proof
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Paper 
        variant="outlined" 
        sx={{ 
          p: 3, 
          mb: 3, 
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="payment-proof-upload"
        />
        <label htmlFor="payment-proof-upload" style={{ cursor: 'pointer' }}>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="body1" fontWeight="medium" gutterBottom>
            {paymentProofFile ? paymentProofFile.name : 'Click to upload payment proof'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported: Images, PDF (Max 5MB)
          </Typography>
          {errors.paymentProof && (
            <Typography variant="body2" color="error" mt={1}>
              {errors.paymentProof}
            </Typography>
          )}
        </label>
      </Paper>

      {/* Action Buttons */}
      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          size="large"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          type="submit"
          disabled={loading}
          size="large"
        >
          {loading ? 'Recording...' : 'Record Payment'}
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentForm;