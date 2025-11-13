import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Avatar
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import { formatCurrency, formatDate } from '../../../../utils/formatters';
import './PaymentHistoryTable.css';

const PaymentHistoryTable = ({ payments, groupId }) => {
  const navigate = useNavigate();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'pending':
        return <PendingIcon color="warning" fontSize="small" />;
      case 'rejected':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'late':
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'success',
      rejected: 'error',
      late: 'error'
    };
    return colors[status] || 'default';
  };

  const handleViewDetails = (paymentId) => {
    navigate(`/payments/${paymentId}`);
  };

  if (payments.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body2" color="text.secondary">
          No payments found
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer className="payment-history-table">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Member</TableCell>
            <TableCell>Cycle</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Payment Mode</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment._id} hover className="payment-row">
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {payment.member?.user?.name?.charAt(0) || 'M'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {payment.member?.user?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Turn {payment.member?.turnNumber || '-'}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>

              <TableCell>
                <Typography variant="body2">
                  Cycle {payment.cycle?.cycleNumber || '-'}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {formatCurrency(payment.amount, payment.group?.currency)}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">
                  {payment.paymentMode?.replace('_', ' ').toUpperCase()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {payment.transactionId}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">
                  {formatDate(payment.paymentDate)}
                </Typography>
              </TableCell>

              <TableCell>
                <Box display="flex" alignItems="center" gap={0.5}>
                  {getStatusIcon(payment.status)}
                  <Chip
                    label={payment.status.toUpperCase()}
                    color={getStatusColor(payment.status)}
                    size="small"
                  />
                </Box>
              </TableCell>

              <TableCell align="right">
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(payment._id)}
                    color="primary"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PaymentHistoryTable;