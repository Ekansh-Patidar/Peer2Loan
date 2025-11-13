import React from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatDate } from '../../../../utils/formatters';
import './CycleTimeline.css';

const CycleTimeline = ({ cycles, currentCycle }) => {
  const getStepIcon = (cycle) => {
    if (cycle.status === 'completed') {
      return <CheckCircleIcon color="success" />;
    } else if (cycle.status === 'active') {
      return <AccessTimeIcon color="primary" />;
    } else {
      return <RadioButtonUncheckedIcon color="disabled" />;
    }
  };

  const getStatusChip = (cycle) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'default' },
      active: { label: 'Active', color: 'primary' },
      completed: { label: 'Completed', color: 'success' },
      overdue: { label: 'Overdue', color: 'error' }
    };
    const config = statusConfig[cycle.status] || statusConfig.pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getPaymentStats = (cycle) => {
    const total = cycle.payments?.length || 0;
    const confirmed = cycle.payments?.filter(p => p.status === 'confirmed').length || 0;
    const pending = cycle.payments?.filter(p => p.status === 'pending').length || 0;
    const late = cycle.payments?.filter(p => p.status === 'late').length || 0;
    return { total, confirmed, pending, late };
  };

  if (!cycles || cycles.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body2" color="text.secondary">
          No cycle data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="cycle-timeline">
      <Stepper orientation="vertical" activeStep={currentCycle - 1}>
        {cycles.map((cycle) => {
          const stats = getPaymentStats(cycle);
          const isActive = cycle.status === 'active';

          return (
            <Step key={cycle._id} expanded>
              <StepLabel icon={getStepIcon(cycle)} optional={getStatusChip(cycle)}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1" fontWeight={isActive ? 'bold' : 'medium'}>
                    Cycle {cycle.cycleNumber}
                  </Typography>
                  {isActive && (
                    <Chip label="Current" color="primary" size="small" variant="outlined" />
                  )}
                </Box>
              </StepLabel>

              <StepContent>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: isActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent'
                  }}
                >
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">Period</Typography>
                    <Typography variant="body1">
                      {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Payment Status
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        label={`${stats.confirmed} Confirmed`}
                        size="small"
                        color="success"
                        variant={stats.confirmed > 0 ? 'filled' : 'outlined'}
                      />
                      <Chip
                        label={`${stats.pending} Pending`}
                        size="small"
                        color="warning"
                        variant={stats.pending > 0 ? 'filled' : 'outlined'}
                      />
                      {stats.late > 0 && (
                        <Chip label={`${stats.late} Late`} size="small" color="error" variant="filled" />
                      )}
                    </Box>
                  </Box>

                  {cycle.beneficiary && (
                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary">Beneficiary</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {cycle.beneficiary.user?.name || 'Unknown'}
                      </Typography>
                    </Box>
                  )}

                  {cycle.payout && (
                    <Box mt={2}>
                      <Chip
                        label={
                          cycle.payout.status === 'completed'
                            ? '✓ Payout Completed'
                            : 'Payout Pending'
                        }
                        color={cycle.payout.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  )}
                </Paper>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

export default CycleTimeline;