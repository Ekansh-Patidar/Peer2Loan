import React from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Chip,
  Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const TurnOrderView = ({ group, members }) => {
  // Sort members by turn number
  const sortedMembers = [...members].sort((a, b) => a.turnNumber - b.turnNumber);
  
  const getCurrentTurnIndex = () => {
    return (group.currentCycle || 1) - 1;
  };

  const getStepIcon = (index) => {
    const currentIndex = getCurrentTurnIndex();
    
    if (index < currentIndex) {
      return <CheckCircleIcon color="success" />;
    } else if (index === currentIndex) {
      return <PlayArrowIcon color="primary" />;
    } else {
      return <RadioButtonUncheckedIcon color="disabled" />;
    }
  };

  const getStepStatus = (index) => {
    const currentIndex = getCurrentTurnIndex();
    
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <Box>
      {sortedMembers.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No members assigned yet
        </Typography>
      ) : (
        <Stepper activeStep={getCurrentTurnIndex()} orientation="vertical">
          {sortedMembers.map((member, index) => {
            const status = getStepStatus(index);
            
            return (
              <Step key={member._id}>
                <StepLabel
                  icon={getStepIcon(index)}
                  optional={
                    status === 'current' && (
                      <Chip
                        label="Current Turn"
                        color="primary"
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    )
                  }
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 40, height: 40 }}>
                      {member.user?.name?.charAt(0) || 'M'}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {member.user?.name || 'Unknown Member'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Turn {member.turnNumber} {status === 'completed' && '✓'}
                      </Typography>
                    </Box>
                  </Box>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      )}
    </Box>
  );
};

export default TurnOrderView;