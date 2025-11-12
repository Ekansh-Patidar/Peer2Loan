import React, { useRef, useState } from 'react';
import './FileUpload.css';

const FileUpload = ({
  accept,
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  onChange,
  onError,
  disabled = false,
  label = 'Upload File',
  helperText,
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFiles = (fileList) => {
    const validFiles = [];
    const errors = [];

    Array.from(fileList).forEach((file) => {
      if (maxSize && file.size > maxSize) {
        errors.push(`${file.name} exceeds maximum size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0 && onError) {
      onError(errors);
    }

    return validFiles;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    const validFiles = validateFiles(droppedFiles);

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(newFiles);
      onChange && onChange(newFiles);
    }
  };

  const handleChange = (e) => {
    const selectedFiles = e.target.files;
    const validFiles = validateFiles(selectedFiles);

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(newFiles);
      onChange && onChange(newFiles);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange && onChange(newFiles);
  };

  const containerClasses = [
    'file-upload',
    dragActive && 'file-upload-drag-active',
    disabled && 'file-upload-disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div
        className="file-upload-dropzone"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="file-upload-input"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
        />
        <div className="file-upload-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="file-upload-label">{label}</p>
        <p className="file-upload-helper">
          {helperText || 'Drag and drop or click to browse'}
        </p>
      </div>

      {files.length > 0 && (
        <div className="file-upload-list">
          {files.map((file, index) => (
            <div key={index} className="file-upload-item">
              <div className="file-upload-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="file-upload-item-info">
                <p className="file-upload-item-name">{file.name}</p>
                <p className="file-upload-item-size">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                className="file-upload-item-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                aria-label="Remove file"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
