import React from 'react';
import { Button } from '../../../common';
import './PaymentDetailsModal.css';

/**
 * PaymentDetailsModal - View payment details including transaction proof
 */
const PaymentDetailsModal = ({ isOpen, onClose, payment }) => {
  if (!isOpen) return null;
  
  if (!payment) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content payout-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Payment Details</h2>
            <button className="close-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <p>No payment data available.</p>
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
      pending: { bg: '#fff3e0', color: '#f57c00', label: 'Pending' },
      under_review: { bg: '#fff9c4', color: '#f57f17', label: 'Under Review' },
      verified: { bg: '#c8e6c9', color: '#388e3c', label: 'Verified' },
      confirmed: { bg: '#e8f5e9', color: '#2e7d32', label: 'Paid' },
      paid: { bg: '#e8f5e9', color: '#2e7d32', label: 'Paid' },
      rejected: { bg: '#ffebee', color: '#c62828', label: 'Rejected' },
      late: { bg: '#ffebee', color: '#c62828', label: 'Late' },
    };
    const style = colors[status] || colors.pending;
    return (
      <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: style.bg, color: style.color }}>
        {style.label}
      </span>
    );
  };

  const apiUrl = window.location.origin.includes('localhost') 
    ? 'http://localhost:5000' 
    : window.location.origin;
  
  // Construct the proof URL
  let proofUrl = null;
  if (payment.proofDocument?.path) {
    const path = payment.proofDocument.path;
    const fullPath = path.startsWith('uploads/') ? path : `uploads/${path}`;
    proofUrl = `${apiUrl}/${fullPath}`;
  } else if (payment.paymentProof) {
    proofUrl = payment.paymentProof.startsWith('http') 
      ? payment.paymentProof 
      : `${apiUrl}/${payment.paymentProof.replace(/^\//, '')}`;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payout-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Payment Details</h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="status-header">
            {getStatusBadge(payment.status)}
            <div className="amount-display">₹{payment.amount?.toLocaleString()}</div>
          </div>

          <div className="details-section">
            <h3>Group Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Group</span>
                <span className="value">{payment.group?.name || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Cycle</span>
                <span className="value">Cycle {payment.cycle?.cycleNumber || payment.cycleNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>Member</h3>
            <div className="beneficiary-card">
              <div className="avatar">
                {payment.member?.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="info">
                <div className="name">{payment.member?.user?.name || 'Unknown'}</div>
                <div className="email">{payment.member?.user?.email || ''}</div>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>Transaction Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Payment Mode</span>
                <span className="value">{payment.paymentMode?.replace('_', ' ')?.toUpperCase() || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Transaction ID</span>
                <span className="value">{payment.transactionId || 'N/A'}</span>
              </div>
              {payment.referenceNumber && (
                <div className="detail-item">
                  <span className="label">Reference Number</span>
                  <span className="value">{payment.referenceNumber}</span>
                </div>
              )}
              {payment.paidAt && (
                <div className="detail-item">
                  <span className="label">Paid At</span>
                  <span className="value">{new Date(payment.paidAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {payment.memberRemarks && (
            <div className="details-section">
              <h3>Member Remarks</h3>
              <div className="remarks-box">{payment.memberRemarks}</div>
            </div>
          )}

          {payment.adminRemarks && (
            <div className="details-section">
              <h3>Admin Remarks</h3>
              <div className="remarks-box">{payment.adminRemarks}</div>
            </div>
          )}

          {proofUrl && (
            <div className="details-section">
              <h3>Payment Proof</h3>
              <div className="proof-container">
                {payment.proofDocument?.mimetype?.startsWith('image/') || proofUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img 
                    src={proofUrl} 
                    alt="Payment Proof" 
                    className="proof-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <a 
                  href={proofUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="proof-link"
                  style={{ display: payment.proofDocument?.mimetype?.startsWith('image/') ? 'none' : 'flex' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  View Document
                </a>
              </div>
            </div>
          )}

          <div className="details-section timeline">
            <h3>Timeline</h3>
            <div className="timeline-list">
              {payment.createdAt && (
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Payment Recorded</div>
                    <div className="timeline-date">{new Date(payment.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {payment.paidAt && payment.paidAt !== payment.createdAt && (
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Payment Made</div>
                    <div className="timeline-date">{new Date(payment.paidAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {payment.confirmedAt && (
                <div className="timeline-item">
                  <div className="timeline-dot completed"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Payment Confirmed</div>
                    <div className="timeline-date">{new Date(payment.confirmedAt).toLocaleString()}</div>
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
};

export default PaymentDetailsModal;
