import React, { useState, useEffect } from 'react';
import './PotCounter.css';

/**
 * PotCounter - Animated counter showing total pot amount
 */
const PotCounter = ({ amount = 0, label = 'Total Pot', currency = '₹' }) => {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    // Animate counter from 0 to amount
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = amount / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;

      if (step >= steps) {
        setDisplayAmount(amount);
        clearInterval(timer);
      } else {
        setDisplayAmount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [amount]);

  const formatAmount = (value) => {
    return value.toLocaleString('en-IN');
  };

  return (
    <div className="pot-counter">
      <div className="pot-counter-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <div className="pot-counter-content">
        <div className="pot-counter-label">{label}</div>
        <div className="pot-counter-amount">
          <span className="currency">{currency}</span>
          <span className="amount">{formatAmount(displayAmount)}</span>
        </div>
      </div>
      <div className="pot-counter-glow"></div>
    </div>
  );
};

export default PotCounter;
