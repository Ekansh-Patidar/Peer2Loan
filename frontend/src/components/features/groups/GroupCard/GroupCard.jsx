// src/components/features/groups/GroupCard/GroupCard.jsx
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Tooltip
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { formatCurrency, formatDate } from '../../../../utils/formatters';
import './GroupCard.css';

/**
 * Group Card Component
 * Member 2: Display group summary
 */
const GroupCard = ({ group, onClick }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      active: 'success',
      completed: 'info',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const getMemberProgress = () => {
    const acceptedCount = group.members?.filter(m => m.status === 'active').length || 0;
    return (acceptedCount / group.memberCount) * 100;
  };

  const getCycleProgress = () => {
    if (!group.currentCycle || !group.duration) return 0;
    return (group.currentCycle / group.duration) * 100;
  };

  return (
    <Card 
      className="group-card" 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Typography variant="h6" fontWeight="bold" noWrap>
            {group.name}
          </Typography>
          <Chip 
            label={group.status.toUpperCase()} 
            color={getStatusColor(group.status)}
            size="small"
          />
        </Box>

        {/* Description */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          mb={2}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {group.description || 'No description'}
        </Typography>

        {/* Monthly Contribution */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AttachMoneyIcon fontSize="small" color="primary" />
          <Typography variant="h6" fontWeight="bold" color="primary">
            {formatCurrency(group.monthlyContribution, group.currency)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            /month
          </Typography>
        </Box>

        {/* Members Progress */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <GroupIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Members
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight="medium">
              {group.members?.filter(m => m.status === 'active').length || 0} / {group.memberCount}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getMemberProgress()} 
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Cycle Progress (for active groups) */}
        {group.status === 'active' && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <CalendarTodayIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Cycle Progress
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {group.currentCycle || 0} / {group.duration}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getCycleProgress()} 
              color="secondary"
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {/* Start Date */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CalendarTodayIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Starts: {formatDate(group.startDate)}
          </Typography>
        </Box>

        {/* Member Avatars */}
        {group.members && group.members.length > 0 && (
          <Box>
            <AvatarGroup max={5} sx={{ justifyContent: 'flex-start' }}>
              {group.members.slice(0, 5).map((member, index) => (
                <Tooltip key={index} title={member.user?.name || 'Member'}>
                  <Avatar 
                    sx={{ width: 32, height: 32 }}
                    alt={member.user?.name}
                  >
                    {member.user?.name?.charAt(0) || 'M'}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button 
          size="small" 
          variant="outlined" 
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default GroupCard;