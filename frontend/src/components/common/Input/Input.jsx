import React, { useState } from 'react';
import './Input.css';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  disabled = false,
  required = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  name,
  id,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  const containerClasses = [
    'input-container',
    fullWidth && 'input-full-width',
    error && 'input-error',
    disabled && 'input-disabled',
    isFocused && 'input-focused',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {icon && iconPosition === 'left' && (
          <span className="input-icon input-icon-left">{icon}</span>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          className={`input-field ${icon ? `input-with-icon-${iconPosition}` : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <span className="input-icon input-icon-right">{icon}</span>
        )}
      </div>
      {(error || helperText) && (
        <span className={`input-helper ${error ? 'input-helper-error' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
};

export default Input;
