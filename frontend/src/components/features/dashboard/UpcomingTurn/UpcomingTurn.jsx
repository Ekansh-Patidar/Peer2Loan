import React from 'react';
import './UpcomingTurn.css';

/**
 * UpcomingTurn - Display upcoming turns/cycles
 */
const UpcomingTurn = ({ turns = [], currentCycle = 0 }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntil = (date) => {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!turns || turns.length === 0) {
    return (
      <div className="upcoming-turn-empty">
        <p>No upcoming turns scheduled</p>
      </div>
    );
  }

  return (
    <div className="upcoming-turn">
      <div className="upcoming-turn-header">
        <h3>Upcoming Turns</h3>
        <span className="current-cycle-badge">Cycle {currentCycle}</span>
      </div>

      <div className="upcoming-turn-list">
        {turns.map((turn, index) => {
          const daysUntil = getDaysUntil(turn.startDate);
          const isNext = index === 0;

          return (
            <div key={turn.cycleNumber} className={`turn-item ${isNext ? 'next' : ''}`}>
              <div className="turn-number">
                <span className="cycle-num">#{turn.cycleNumber}</span>
                {isNext && <span className="next-badge">Next</span>}
              </div>

              <div className="turn-content">
                <div className="turn-beneficiary">
                  <div className="beneficiary-avatar">
                    {turn.beneficiary.charAt(0).toUpperCase()}
                  </div>
                  <div className="beneficiary-info">
                    <div className="beneficiary-name">{turn.beneficiary}</div>
                    <div className="beneficiary-turn">Turn {turn.turnNumber}</div>
                  </div>
                </div>

                <div className="turn-date">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{formatDate(turn.startDate)}</span>
                </div>

                {daysUntil >= 0 && (
                  <div className={`turn-countdown ${daysUntil <= 7 ? 'urgent' : ''}`}>
                    {daysUntil === 0 ? (
                      <span>Today</span>
                    ) : daysUntil === 1 ? (
                      <span>Tomorrow</span>
                    ) : (
                      <span>In {daysUntil} days</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingTurn;
