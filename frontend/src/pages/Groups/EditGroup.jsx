import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import GroupForm from '../../components/features/groups/GroupForm/GroupForm';

const EditGroup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  if (!currentGroup) return <div className="loading">Loading group details...</div>;

  return (
    <div className="edit-group-page">
      <div className="page-header">
        <h1>Edit Group</h1>
        <p>Update the group information and settings.</p>
      </div>

      <GroupForm
        initialData={currentGroup}
        onSubmit={handleUpdate}
        onCancel={() => navigate(`/groups/${id}`)}
      />
    </div>
  );
};

export default EditGroup;