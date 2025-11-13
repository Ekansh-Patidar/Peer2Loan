import React from 'react';
import './StatusCards.css';

/**
 * StatusCards - Display key metrics in card format
 */
const StatusCards = ({ stats = [] }) => {
  const getIconForType = (type) => {
    switch (type) {
      case 'members':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'collected':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'disbursed':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'cycles':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'pending':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'late':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          </svg>
        );
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'members':
        return 'blue';
      case 'collected':
        return 'green';
      case 'disbursed':
        return 'purple';
      case 'cycles':
        return 'orange';
      case 'pending':
        return 'yellow';
      case 'late':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <div className="status-cards">
      {stats.map((stat, index) => (
        <div key={index} className={`status-card ${getColorForType(stat.type)}`}>
          <div className="status-card-icon">
            {getIconForType(stat.type)}
          </div>
          <div className="status-card-content">
            <div className="status-card-label">{stat.label}</div>
            <div className="status-card-value">
              {stat.prefix && <span className="prefix">{stat.prefix}</span>}
              {stat.value}
              {stat.suffix && <span className="suffix">{stat.suffix}</span>}
            </div>
            {stat.subtext && (
              <div className="status-card-subtext">{stat.subtext}</div>
            )}
          </div>
          {stat.trend && (
            <div className={`status-card-trend ${stat.trend > 0 ? 'up' : 'down'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {stat.trend > 0 ? (
                  <polyline points="18 15 12 9 6 15" />
                ) : (
                  <polyline points="6 9 12 15 18 9" />
                )}
              </svg>
              <span>{Math.abs(stat.trend)}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatusCards;
