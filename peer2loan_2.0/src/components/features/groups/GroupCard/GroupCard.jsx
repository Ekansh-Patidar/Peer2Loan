import './GroupCard.css';

const GroupCard = ({ group, onSelect, onEdit, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete group "${group.name}"?`)) {
      onDelete(group.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(group.id);
  };

  return (
    <div className="group-card" onClick={() => onSelect(group.id)}>
      <div className="group-card-header">
        <h3>{group.name}</h3>
        <span className={`status-badge ${group.status}`}>
          {group.status}
        </span>
      </div>

      <div className="group-card-body">
        <div className="info-row">
          <span className="label">Members:</span>
          <span className="value">{group.memberCount}</span>
        </div>
        <div className="info-row">
          <span className="label">Contribution:</span>
          <span className="value">₹{group.monthlyContribution}</span>
        </div>
        <div className="info-row">
          <span className="label">Cycle:</span>
          <span className="value">{group.currentCycle}</span>
        </div>
      </div>

      <div className="group-card-footer">
        <button
          className="btn-secondary btn-sm"
          onClick={handleEdit}
        >
          Edit
        </button>
        <button
          className="btn-danger btn-sm"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default GroupCard;