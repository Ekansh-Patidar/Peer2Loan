import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/layout';
import { Card, Loader } from '../../components/common';
import GroupForm from '../../components/features/groups/GroupForm/GroupForm';
import './EditGroup.css';

const EditGroup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentGroup, selectGroup, updateExistingGroup } = useGroups();

  useEffect(() => {
    selectGroup(id);
  }, [id, selectGroup]);

  const handleUpdate = async (formData) => {
    const result = await updateExistingGroup(id, formData);
    if (result.success) {
      navigate(`/groups/${id}`);
    } else {
      alert('Failed to update group: ' + result.error);
    }
  };

  if (!currentGroup) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading group..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="edit-group-page">
        <div className="page-header">
          <h1>Edit Group</h1>
          <p className="page-subtitle">Update the group information and settings.</p>
        </div>

        <Card>
          <GroupForm
            initialData={currentGroup}
            onSubmit={handleUpdate}
            onCancel={() => navigate(`/groups/${id}`)}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EditGroup;