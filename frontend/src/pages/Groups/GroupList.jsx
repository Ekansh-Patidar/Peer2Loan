import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import GroupCard from '../../components/features/groups/GroupCard/GroupCard';

const GroupList = () => {
  const navigate = useNavigate();
  const { groups, loading, loadGroups, deleteExistingGroup } = useGroups();

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  if (loading) return <div>Loading groups...</div>;

  return (
    <div className="group-list-page">
      <div className="page-header">
        <h1>My Groups</h1>
        <button
          className="btn-primary"
          onClick={() => navigate('/groups/create')}
        >
          Create New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <h2>No groups yet</h2>
          <p>Create your first savings group to get started.</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/groups/create')}
          >
            Create Group
          </button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              onSelect={(id) => navigate(`/groups/${id}`)}
              onEdit={(id) => navigate(`/groups/${id}/edit`)}
               onDelete={async (id) => {
                 const result = await deleteExistingGroup(id);
                 if (!result.success) {
                   alert('Failed to delete group: ' + result.error);
                 }
               }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupList;