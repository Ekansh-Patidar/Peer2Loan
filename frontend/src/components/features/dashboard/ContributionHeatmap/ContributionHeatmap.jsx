import React from 'react';
import './ContributionHeatmap.css';

/**
 * ContributionHeatmap - Visual representation of member contributions
 */
const ContributionHeatmap = ({ data = [] }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
      case 'verified':
        return 'success';
      case 'pending':
      case 'under_review':
        return 'warning';
      case 'late':
        return 'error';
      case 'missed':
      case 'defaulted':
        return 'missed';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
      case 'verified':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'under_review':
        return 'Under Review';
      case 'late':
        return 'Late';
      case 'missed':
      case 'defaulted':
        return 'Missed';
      default:
        return 'Pending';
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="contribution-heatmap-empty">
        <p>No contribution data available</p>
      </div>
    );
  }

  return (
    <div className="contribution-heatmap">
      <div className="contribution-heatmap-header">
        <h3>Contribution Status</h3>
        <div className="contribution-heatmap-legend">
          <div className="legend-item">
            <span className="legend-dot success"></span>
            <span>Paid</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot warning"></span>
            <span>Pending</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot error"></span>
            <span>Late</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot missed"></span>
            <span>Missed</span>
          </div>
        </div>
      </div>

      <div className="contribution-heatmap-grid">
        {data.map((member) => (
          <div
            key={member.memberId}
            className={`contribution-cell ${getStatusColor(member.status)} ${member.hasPenalty ? 'has-penalty' : ''}`}
            title={`${member.memberName} (Turn ${member.turnNumber}) - ${getStatusLabel(member.status)}${member.hasPenalty ? `\nUnpaid Penalties: ₹${member.penaltyAmount.toLocaleString()} (${member.penaltyCount})` : ''}`}
          >
            <div className="cell-content">
              <div className="cell-turn">T{member.turnNumber}</div>
              <div className="cell-name">{member.memberName}</div>
              <div className="cell-status">{getStatusLabel(member.status)}</div>
              {member.amount > 0 && (
                <div className="cell-amount">₹{member.amount.toLocaleString()}</div>
              )}
              {member.hasPenalty && (
                <div className="cell-penalty-badge" title={`${member.penaltyCount} unpaid penalties`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  ₹{member.penaltyAmount.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContributionHeatmap;
