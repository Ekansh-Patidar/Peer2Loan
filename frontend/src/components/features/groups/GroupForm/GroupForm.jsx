import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Divider
} from '@mui/material';
import { CURRENCIES, TURN_ORDER_TYPES } from '../../../../utils/constants';

const GroupForm = ({ initialData = {}, onSubmit, onCancel, loading, isEditMode = false }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    monthlyContribution: initialData.monthlyContribution || '',
    currency: initialData.currency || 'INR',
    memberCount: initialData.memberCount || '',
    startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
    turnOrderType: initialData.turnOrderType || 'fixed',
    paymentWindow: {
      startDay: initialData.paymentWindow?.startDay || 1,
      endDay: initialData.paymentWindow?.endDay || 7
    },
    penaltyRules: {
      lateFee: initialData.penaltyRules?.lateFee || 200,
      gracePeriodDays: initialData.penaltyRules?.gracePeriodDays || 2,
      defaultThreshold: initialData.penaltyRules?.defaultThreshold || 2,
      compoundPenalty: initialData.penaltyRules?.compoundPenalty || false
    },
    settings: {
      allowMidCycleExit: initialData.settings?.allowMidCycleExit || false,
      requirePaymentProof: initialData.settings?.requirePaymentProof || true,
      autoConfirmPayments: initialData.settings?.autoConfirmPayments || false,
      enableReminders: initialData.settings?.enableReminders || true,
      reminderDaysBefore: initialData.settings?.reminderDaysBefore || 3
    }
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: fieldValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: fieldValue
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Group name is required';
    if (!formData.monthlyContribution || formData.monthlyContribution <= 0) {
      newErrors.monthlyContribution = 'Valid monthly contribution is required';
    }
    if (!formData.memberCount || formData.memberCount < 3) {
      newErrors.memberCount = 'Minimum 3 members required';
    }
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    
    if (formData.paymentWindow.startDay >= formData.paymentWindow.endDay) {
      newErrors.paymentWindow = 'End day must be after start day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Basic Information */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Basic Information
      </Typography>
      
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Group Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            required
            disabled={isEditMode}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Monthly Contribution"
            name="monthlyContribution"
            type="number"
            value={formData.monthlyContribution}
            onChange={handleChange}
            error={!!errors.monthlyContribution}
            helperText={errors.monthlyContribution}
            required
            disabled={isEditMode}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            disabled={isEditMode}
          >
            {CURRENCIES.map(currency => (
              <MenuItem key={currency.code} value={currency.code}>
                {currency.symbol} {currency.code}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Number of Members"
            name="memberCount"
            type="number"
            value={formData.memberCount}
            onChange={handleChange}
            error={!!errors.memberCount}
            helperText={errors.memberCount}
            required
            disabled={isEditMode}
            InputProps={{ inputProps: { min: 3, max: 50 } }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            error={!!errors.startDate}
            helperText={errors.startDate}
            required
            disabled={isEditMode}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            select
            label="Turn Order Type"
            name="turnOrderType"
            value={formData.turnOrderType}
            onChange={handleChange}
            disabled={isEditMode}
          >
            {TURN_ORDER_TYPES.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Payment Window */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Payment Window
      </Typography>
      
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Start Day of Month"
            name="paymentWindow.startDay"
            type="number"
            value={formData.paymentWindow.startDay}
            onChange={handleChange}
            InputProps={{ inputProps: { min: 1, max: 28 } }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="End Day of Month"
            name="paymentWindow.endDay"
            type="number"
            value={formData.paymentWindow.endDay}
            onChange={handleChange}
            error={!!errors.paymentWindow}
            helperText={errors.paymentWindow}
            InputProps={{ inputProps: { min: 1, max: 31 } }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Penalty Rules */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Penalty Rules
      </Typography>
      
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Late Fee Amount"
            name="penaltyRules.lateFee"
            type="number"
            value={formData.penaltyRules.lateFee}
            onChange={handleChange}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Grace Period (Days)"
            name="penaltyRules.gracePeriodDays"
            type="number"
            value={formData.penaltyRules.gracePeriodDays}
            onChange={handleChange}
            InputProps={{ inputProps: { min: 0, max: 7 } }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Default Threshold (Late Payments)"
            name="penaltyRules.defaultThreshold"
            type="number"
            value={formData.penaltyRules.defaultThreshold}
            onChange={handleChange}
            InputProps={{ inputProps: { min: 1, max: 5 } }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.penaltyRules.compoundPenalty}
                onChange={handleChange}
                name="penaltyRules.compoundPenalty"
              />
            }
            label="Compound Penalties"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Settings */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Group Settings
      </Typography>
      
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.settings.requirePaymentProof}
                onChange={handleChange}
                name="settings.requirePaymentProof"
              />
            }
            label="Require Payment Proof"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.settings.autoConfirmPayments}
                onChange={handleChange}
                name="settings.autoConfirmPayments"
              />
            }
            label="Auto-Confirm Payments"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.settings.enableReminders}
                onChange={handleChange}
                name="settings.enableReminders"
              />
            }
            label="Enable Reminders"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.settings.allowMidCycleExit}
                onChange={handleChange}
                name="settings.allowMidCycleExit"
              />
            }
            label="Allow Mid-Cycle Exit"
          />
        </Grid>

        {formData.settings.enableReminders && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Reminder Days Before Due"
              name="settings.reminderDaysBefore"
              type="number"
              value={formData.settings.reminderDaysBefore}
              onChange={handleChange}
              InputProps={{ inputProps: { min: 1, max: 7 } }}
            />
          </Grid>
        )}
      </Grid>

      {/* Action Buttons */}
      <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : isEditMode ? 'Update Group' : 'Create Group'}
        </Button>
      </Box>
    </Box>
  );
};

export default GroupForm;