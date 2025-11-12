// src/pages/Groups/GroupList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  CircularProgress,
  Tabs,
  Tab,
  Container
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useGroups } from '../../hooks/useGroups';
import GroupCard from '../../components/features/groups/GroupCard/GroupCard';

/**
 * Group List Page - View all groups
 * Member 2: Group Management
 */
const GroupList = () => {
  const navigate = useNavigate();
  const { groups, loading, fetchGroups } = useGroups();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Fetch groups with different status filters
    const statusMap = {
      0: undefined, // All
      1: 'pending',
      2: 'active',
      3: 'completed'
    };
    
    fetchGroups({ status: statusMap[newValue] });
  };

  const handleCreateGroup = () => {
    navigate('/groups/create');
  };

  const handleGroupClick = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  if (loading && groups.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          My Groups
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateGroup}
          size="large"
        >
          Create Group
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="All Groups" />
          <Tab label="Pending" />
          <Tab label="Active" />
          <Tab label="Completed" />
        </Tabs>
      </Box>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No groups found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create a new group to get started with peer-to-peer lending
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateGroup}
          >
            Create Your First Group
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {groups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group._id}>
              <GroupCard 
                group={group} 
                onClick={() => handleGroupClick(group._id)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default GroupList;