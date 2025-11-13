import './TurnOrderView.css';

const TurnOrderView = ({ turnOrder, currentTurn }) => {
  if (!turnOrder || turnOrder.length === 0) {
    return (
      <div className="turn-order">
        <h3>Turn Order</h3>
        <p className="no-turns">No turn order available yet.</p>
      </div>
    );
  }

  return (
    <div className="turn-order">
      <h3>Turn Order</h3>
      <ol className="turn-list">
        {turnOrder.map((member, index) => (
          <li
            key={member.id}
            className={`turn-item ${index === currentTurn ? 'current-turn' : ''}`}
          >
            <div className="turn-info">
              <span className="member-name">{member.name}</span>
              <span className="turn-month">{member.turnMonth}</span>
            </div>
            {index === currentTurn && (
              <span className="current-badge">Current Turn</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default TurnOrderView;