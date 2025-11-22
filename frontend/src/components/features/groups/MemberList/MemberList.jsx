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
        {members.map((member) => {
          const memberId = member._id || member.id;
          const memberName = member.user?.name || member.name || 'Unknown';
          const memberRole = member.role || 'member';
          const memberStatus = member.status || 'active';
          
          return (
            <div key={memberId} className="member-item">
              <div className="member-avatar">
                {memberName.charAt(0).toUpperCase()}
              </div>
              <div className="member-info">
                <div className="member-name">
                  {memberName}
                  {memberStatus === 'invited' && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '11px', 
                      padding: '2px 8px', 
                      borderRadius: '8px',
                      background: '#e3f2fd',
                      color: '#1976d2'
                    }}>
                      INVITED
                    </span>
                  )}
                </div>
                <div className="member-role">
                  {memberRole} • Turn #{member.turnNumber || 'N/A'}
                </div>
              </div>
              {canEdit && member.user?._id !== currentUserId && (
                <button
                  className="btn-remove"
                  onClick={() => handleRemove(member)}
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemberList;