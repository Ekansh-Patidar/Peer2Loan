import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Box } from '@mui/material';
import { useGroups } from '../../hooks/useGroups';
import GroupForm from '../../components/features/groups/GroupForm/GroupForm';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { createGroup, loading } = useGroups();

  const handleSubmit = async (groupData) => {
    try {
      const newGroup = await createGroup(groupData);
      navigate(`/groups/${newGroup._id}`);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleCancel = () => {
    navigate('/groups');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Create New Group
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Set up a new lending pool for your community
        </Typography>
        
        <GroupForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </Paper>
    </Container>
  );
};

export default CreateGroup;