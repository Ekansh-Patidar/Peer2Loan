import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useGroups } from '../../hooks/useGroups';
import GroupForm from '../../components/features/groups/GroupForm/GroupForm';

const EditGroup = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { currentGroup, loading, fetchGroupById, updateGroup } = useGroups();

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
    }
  }, [groupId, fetchGroupById]);

  const handleSubmit = async (groupData) => {
    try {
      await updateGroup(groupId, groupData);
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  const handleCancel = () => {
    navigate(`/groups/${groupId}`);
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Group not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Edit Group
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Update your group settings
        </Typography>
        
        <GroupForm
          initialData={currentGroup}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          isEditMode={true}
        />
      </Paper>
    </Container>
  );
};

export default EditGroup;