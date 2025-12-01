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
            className={`contribution-cell ${getStatusColor(member.status)}`}
            title={`${member.memberName} (Turn ${member.turnNumber}) - ${getStatusLabel(member.status)}`}
          >
            <div className="cell-content">
              <div className="cell-turn">T{member.turnNumber}</div>
              <div className="cell-name">{member.memberName}</div>
              <div className="cell-status">{getStatusLabel(member.status)}</div>
              {member.amount > 0 && (
                <div className="cell-amount">₹{member.amount.toLocaleString()}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContributionHeatmap;
