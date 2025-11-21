import { useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/layout';
import { Card } from '../../components/common';
import GroupForm from '../../components/features/groups/GroupForm/GroupForm';
import './CreateGroup.css';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { createNewGroup } = useGroups();

  const handleSubmit = async (formData) => {
    const result = await createNewGroup(formData);
    if (result.success) {
      // Redirect to the newly created group's details page
      const groupId = result.data.group?._id || result.data._id;
      if (groupId) {
        navigate(`/groups/${groupId}`);
      } else {
        navigate('/groups');
      }
    } else {
      alert('Failed to create group: ' + result.error);
    }
  };

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div className="create-group-page">
        <div className="page-header">
          <h1>Create New Group</h1>
          <p className="page-subtitle">Start a savings group and invite members to join.</p>
        </div>

        <Card>
          <GroupForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/groups')}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateGroup;