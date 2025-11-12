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
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useGroups } from '../../hooks/useGroups';
import { useAuth } from '../../hooks/useAuth';
import MemberList from '../../components/features/groups/MemberList/MemberList';
import TurnOrderView from '../../components/features/groups/TurnOrderView/TurnOrderView';
import InviteModal from '../../components/features/groups/InviteModal/InviteModal';
import { formatCurrency, formatDate } from '../../utils/formatters';

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentGroup, 
    groupMembers, 
    groupStats,
    loading, 
    fetchGroupById, 
    fetchGroupMembers,
    fetchGroupStats,
    activateGroup 
  } = useGroups();
  
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchGroupMembers(groupId);
      fetchGroupStats(groupId);
    }
  }, [groupId, fetchGroupById, fetchGroupMembers, fetchGroupStats]);

  const isOrganizer = currentGroup?.organizer === user?._id;
  const canActivate = currentGroup?.status === 'pending' && 
                      groupMembers.filter(m => m.status === 'active').length === currentGroup?.memberCount;

  const handleEdit = () => {
    navigate(`/groups/${groupId}/edit`);
  };

  const handleInvite = () => {
    setInviteModalOpen(true);
  };

  const handleActivate = async () => {
    try {
      await activateGroup(groupId);
    } catch (error) {
      console.error('Failed to activate group:', error);
    }
  };

  if (loading && !currentGroup) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentGroup) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Group not found</Alert>
      </Container>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      active: 'success',
      completed: 'info',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {currentGroup.name}
            </Typography>
            <Chip 
              label={currentGroup.status.toUpperCase()} 
              color={getStatusColor(currentGroup.status)}
              size="small"
            />
          </Box>
          
          {isOrganizer && (
            <Box display="flex" gap={1}>
              {canActivate && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleActivate}
                >
                  Activate Group
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={handleInvite}
              >
                Invite Member
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                Edit
              </Button>
            </Box>
          )}
        </Box>

        <Typography variant="body1" color="text.secondary">
          {currentGroup.description}
        </Typography>
      </Paper>

      {/* Group Info */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Group Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Monthly Contribution
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {formatCurrency(currentGroup.monthlyContribution, currentGroup.currency)}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Members
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {groupMembers.length} / {currentGroup.memberCount}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {currentGroup.duration} months
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(currentGroup.startDate)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Payment Window
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  Day {currentGroup.paymentWindow.startDay} - {currentGroup.paymentWindow.endDay}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Group Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {groupStats ? (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Collected
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(groupStats.totalCollected || 0, currentGroup.currency)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Paid Out
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="info.main">
                    {formatCurrency(groupStats.totalPaidOut || 0, currentGroup.currency)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Pending Payments
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {groupStats.pendingPayments || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Late Payments
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    {groupStats.latePayments || 0}
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No statistics available yet
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Turn Order */}
      {currentGroup.status !== 'pending' && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Turn Order
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TurnOrderView 
            group={currentGroup} 
            members={groupMembers}
          />
        </Paper>
      )}

      {/* Members List */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Members ({groupMembers.length})
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <MemberList 
          members={groupMembers} 
          groupId={groupId}
          isOrganizer={isOrganizer}
        />
      </Paper>

      {/* Invite Modal */}
      <InviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        groupId={groupId}
      />
    </Container>
  );
};

export default GroupDetails;