import './MemberList.css';

const MemberList = ({ members, onRemove, canEdit = false, currentUserId }) => {
  const handleRemove = (member) => {
    if (window.confirm(`Remove ${member.name} from the group?`)) {
      onRemove(member.id);
    }
  };

  if (!members || members.length === 0) {
    return (
      <div className="member-list-empty">
        <p>No members in this group yet.</p>
      </div>
    );
  }

  return (
    <div className="member-list">
      <h3 className="member-list-title">
        Members ({members.length})
      </h3>
      <div className="member-items">
        {members.map((member) => (
          <div key={member.id} className="member-item">
            <div className="member-avatar">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="member-info">
              <div className="member-name">{member.name}</div>
              <div className="member-role">{member.role}</div>
            </div>
            {canEdit && member.id !== currentUserId && (
              <button
                className="btn-remove"
                onClick={() => handleRemove(member)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberList;