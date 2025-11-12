import React from 'react';
import './Card.css';

const Card = ({
  children,
  title,
  subtitle,
  footer,
  variant = 'default',
  hoverable = false,
  clickable = false,
  onClick,
  className = '',
  ...props
}) => {
  const cardClasses = [
    'card',
    `card-${variant}`,
    hoverable && 'card-hoverable',
    clickable && 'card-clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={clickable ? onClick : undefined} {...props}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
