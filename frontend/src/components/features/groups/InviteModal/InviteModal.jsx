import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { useMembers } from '../../../../hooks/useMembers';
import { validateEmail } from '../../../../utils/validators';

const InviteModal = ({ open, onClose, groupId }) => {
  const { inviteMember, loading } = useMembers(groupId);
  const [email, setEmail] = useState('');
  const [turnNumber, setTurnNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!turnNumber || turnNumber < 1) {
      setError('Please enter a valid turn number');
      return;
    }

    try {
      await inviteMember({
        email: email.trim(),
        turnNumber: parseInt(turnNumber)
      });
      
      // Reset form and close
      setEmail('');
      setTurnNumber('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    }
  };

  const handleClose = () => {
    setEmail('');
    setTurnNumber('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Invite Member to Group
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Send an invitation to a new member. They must register first if they haven't already.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              required
              autoFocus
            />

            <TextField
              fullWidth
              label="Turn Number"
              type="number"
              value={turnNumber}
              onChange={(e) => setTurnNumber(e.target.value)}
              placeholder="Enter turn number"
              required
              InputProps={{ inputProps: { min: 1 } }}
              helperText="Assign when this member will receive the pot"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default InviteModal;