import React from 'react';
import { Button } from '../../../common';
import './PayoutDetailsModal.css';

/**
 * PayoutDetailsModal - View payout details including transaction proof
 */
const PayoutDetailsModal = ({ isOpen, onClose, payout }) => {
  console.log('PayoutDetailsModal - isOpen:', isOpen, 'payout:', payout);
  
  if (!isOpen) return null;
  
  // Handle case where payout is null or undefined
  if (!payout) {
    console.error('PayoutDetailsModal - No payout data provided');
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content payout-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Payout Details</h2>
            <button className="close-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <p>No payout data available.</p>
          </div>
          <div className="modal-footer">
            <Button variant="primary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const colors = {
      completed: { bg: '#e8f5e9', color: '#2e7d32', label: 'Completed' },
      pending_approval: { bg: '#fff3e0', color: '#f57c00', label: 'Pending Approval' },
      approved: { bg: '#e8f5e9', color: '#388e3c', label: 'Approved' },
      processing: { bg: '#fff3e0', color: '#f57c00', label: 'Processing' },
      failed: { bg: '#ffebee', color: '#c62828', label: 'Failed' },
      scheduled: { bg: '#e3f2fd', color: '#1976d2', label: 'Scheduled' },
    };
    const style = colors[status] || colors.scheduled;
    return (
      <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: style.bg, color: style.color }}>
        {style.label}
      </span>
    );
  };

  const apiUrl = window.location.origin.includes('localhost') 
    ? 'http://localhost:5000' 
    : window.location.origin;
  
  // Construct the proof URL - ensure it starts with /uploads if not already included
  let proofUrl = null;
  if (payout.proofDocument?.path) {
    const path = payout.proofDocument.path;
    // If path doesn't start with uploads/, add it
    const fullPath = path.startsWith('uploads/') ? path : `uploads/${path}`;
    proofUrl = `${apiUrl}/${fullPath}`;
  }

  // Wrap in try-catch to prevent blank page
  try {
    return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payout-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Payout Details</h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="status-header">
            {getStatusBadge(payout.status)}
            <div className="amount-display">₹{payout.amount?.toLocaleString()}</div>
          </div>

          <div className="details-section">
            <h3>Group Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Group</span>
                <span className="value">{payout.group?.name || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Cycle</span>
                <span className="value">Cycle {payout.cycle?.cycleNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>Beneficiary</h3>
            <div className="beneficiary-card">
              <div className="avatar">
                {payout.beneficiary?.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="info">
                <div className="name">{payout.beneficiary?.user?.name || 'Unknown'}</div>
                <div className="email">{payout.beneficiary?.user?.email || ''}</div>
              </div>
            </div>
          </div>

          {payout.status === 'completed' && (
            <div className="details-section">
              <h3>Transaction Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Transfer Mode</span>
                  <span className="value">{payout.transferMode?.replace('_', ' ')?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Transaction ID</span>
                  <span className="value">{payout.transactionId || 'N/A'}</span>
                </div>
                {payout.transferReference && (
                  <div className="detail-item">
                    <span className="label">Reference</span>
                    <span className="value">{payout.transferReference}</span>
                  </div>
                )}
                {payout.completedAt && (
                  <div className="detail-item">
                    <span className="label">Completed At</span>
                    <span className="value">{new Date(payout.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {payout.processorRemarks && (
            <div className="details-section">
              <h3>Remarks</h3>
              <div className="remarks-box">{payout.processorRemarks}</div>
            </div>
          )}

          {proofUrl && (
            <div className="details-section">
              <h3>Transaction Proof</h3>
              <div className="proof-container">
                {payout.proofDocument?.mimetype?.startsWith('image/') ? (
                  <img src={proofUrl} alt="Transaction Proof" className="proof-image" />
                ) : (
                  <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="proof-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    View Document
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="details-section timeline">
            <h3>Timeline</h3>
            <div className="timeline-list">
              {payout.createdAt && (
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Payout Created</div>
                    <div className="timeline-date">{new Date(payout.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {payout.initiatedAt && (
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Payout Initiated</div>
                    <div className="timeline-date">{new Date(payout.initiatedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {payout.approvedAt && (
                <div className="timeline-item">
                  <div className="timeline-dot approved"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Approved by Beneficiary</div>
                    <div className="timeline-date">{new Date(payout.approvedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {payout.completedAt && (
                <div className="timeline-item">
                  <div className="timeline-dot completed"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Payout Completed</div>
                    <div className="timeline-date">{new Date(payout.completedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="primary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('PayoutDetailsModal - Render error:', error);
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content payout-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Payout Details</h2>
            <button className="close-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <p>Error loading payout details. Please try again.</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>{error.message}</p>
          </div>
          <div className="modal-footer">
            <Button variant="primary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }
};

export default PayoutDetailsModal;
