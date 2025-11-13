import { useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import GroupForm from '../../components/features/groups/GroupForm/GroupForm';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { createNewGroup } = useGroups();

  const handleSubmit = async (formData) => {
    const result = await createNewGroup(formData);
    if (result.success) {
      navigate('/groups');
    } else {
      alert('Failed to create group: ' + result.error);
    }
  };

  return (
    <div className="create-group-page">
      <div className="page-header">
        <h1>Create New Group</h1>
        <p>Start a savings group and invite members to join.</p>
      </div>

      <GroupForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/groups')}
      />
    </div>
  );
};

export default CreateGroup;