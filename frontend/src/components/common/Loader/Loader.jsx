import React from 'react';
import './Loader.css';

const Loader = ({
  size = 'medium',
  variant = 'spinner',
  fullScreen = false,
  text,
  className = ''
}) => {
  const loaderClasses = [
    'loader',
    `loader-${size}`,
    fullScreen && 'loader-fullscreen',
    className
  ].filter(Boolean).join(' ');

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return <div className="loader-spinner"></div>;
      case 'dots':
        return (
          <div className="loader-dots">
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
          </div>
        );
      case 'pulse':
        return <div className="loader-pulse"></div>;
      case 'bars':
        return (
          <div className="loader-bars">
            <div className="loader-bar"></div>
            <div className="loader-bar"></div>
            <div className="loader-bar"></div>
            <div className="loader-bar"></div>
          </div>
        );
      default:
        return <div className="loader-spinner"></div>;
    }
  };

  return (
    <div className={loaderClasses}>
      <div className="loader-content">
        {renderLoader()}
        {text && <p className="loader-text">{text}</p>}
      </div>
    </div>
  );
};

export default Loader;
