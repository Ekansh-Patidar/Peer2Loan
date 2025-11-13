import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { usePayouts } from '../../hooks/usePayouts';
import { useGroups } from '../../hooks/useGroups';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PayoutHistory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { payouts, loading, fetchGroupPayouts } = usePayouts();
  const { fetchGroupById, currentGroup } = useGroups();
  
  const groupId = searchParams.get('groupId');

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchGroupPayouts(groupId);
    }
  }, [groupId, fetchGroupById, fetchGroupPayouts]);

  const handleExecutePayout = () => {
    if (groupId && currentGroup?.currentCycle) {
      navigate(`/payouts/execute?groupId=${groupId}&cycleId=${currentGroup.currentCycle}`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  if (loading && payouts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} variant="outlined">
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight="bold">Payout History</Typography>
            {currentGroup && (
              <Typography variant="body2" color="text.secondary">
                {currentGroup.name}
              </Typography>
            )}
          </Box>
        </Box>
        
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleExecutePayout}>
          Execute Payout
        </Button>
      </Box>

      <Paper elevation={2}>
        {payouts.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No payouts yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Execute your first payout to get started
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleExecutePayout}>
              Execute Payout
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cycle</TableCell>
                  <TableCell>Beneficiary</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Transfer Mode</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        Cycle {payout.cycle?.cycleNumber || '-'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {payout.beneficiary?.user?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Turn {payout.beneficiary?.turnNumber || '-'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {formatCurrency(payout.amount, currentGroup?.currency)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {payout.transferMode?.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(payout.scheduledDate || payout.createdAt)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={payout.status.toUpperCase()}
                        color={getStatusColor(payout.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default PayoutHistory;