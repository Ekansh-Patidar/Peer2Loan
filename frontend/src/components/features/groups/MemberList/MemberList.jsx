import React from 'react';
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
  Avatar,
  Box,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { useMembers } from '../../../../hooks/useMembers';
import { formatDate } from '../../../../utils/formatters';

const MemberList = ({ members, groupId, isOrganizer }) => {
  const { removeMember, resendInvitation, loading } = useMembers(groupId);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'pending':
        return <PendingIcon color="warning" fontSize="small" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      pending: 'warning',
      inactive: 'default',
      defaulted: 'error'
    };
    return colors[status] || 'default';
  };

  const handleRemove = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      await removeMember(memberId);
    }
  };

  const handleResendInvite = async (memberId) => {
    await resendInvitation(memberId);
  };

  if (members.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body2" color="text.secondary">
          No members yet
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Member</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Turn</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Joined</TableCell>
            {isOrganizer && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member._id} hover>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {member.user?.name?.charAt(0) || 'M'}
                  </Avatar>
                  <Typography variant="body2" fontWeight="medium">
                    {member.user?.name || 'Unknown'}
                  </Typography>
                </Box>
              </TableCell>
              
              <TableCell>
                <Typography variant="body2">
                  {member.user?.email || 'N/A'}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Chip
                  label={`Turn ${member.turnNumber || '-'}`}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              
              <TableCell>
                <Box display="flex" alignItems="center" gap={0.5}>
                  {getStatusIcon(member.status)}
                  <Chip
                    label={member.status.toUpperCase()}
                    color={getStatusColor(member.status)}
                    size="small"
                  />
                </Box>
              </TableCell>
              
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {member.joinedAt ? formatDate(member.joinedAt) : 'Not joined'}
                </Typography>
              </TableCell>
              
              {isOrganizer && (
                <TableCell align="right">
                  <Box display="flex" gap={0.5} justifyContent="flex-end">
                    {member.status === 'pending' && (
                      <Tooltip title="Resend Invitation">
                        <IconButton
                          size="small"
                          onClick={() => handleResendInvite(member._id)}
                          disabled={loading}
                        >
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Remove Member">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemove(member._id)}
                        disabled={loading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MemberList;
