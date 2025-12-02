import React, { useState } from 'react';
import { Button, Alert } from '../../../common';
import api from '../../../../services/api';
import './PaymentApprovalModal.css';

/**
 * PaymentApprovalModal - Admin reviews and approves/rejects payment
 * Styled to match ProcessPayoutModal
 */
const PaymentApprovalModal = ({ isOpen, onClose, payment, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [action, setAction] = useState(null);

  const handleApprove = async () => {
    setError(null);
    setAction('approve');

    try {
      setLoading(true);
      await api.put(`/payments/${payment._id}/confirm`, {
        adminRemarks: adminRemarks || 'Payment verified and approved'
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to approve payment');
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleReject = async () => {
    if (!adminRemarks.trim()) {
      setError('Please provide a reason for rejection in the Admin Remarks field');
      alert('Please provide a reason for rejection in the Admin Remarks field');
      return;
    }

    setError(null);
    setAction('reject');

    try {
      setLoading(true);
      await api.put(`/payments/${payment._id}/reject`, {
        adminRemarks
      });

      alert('Payment rejected successfully');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to reject payment';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  if (!isOpen || !payment) return null;

  // Get proof URL
  const getProofUrl = () => {
    if (!payment.proofDocument?.path && !payment.paymentProof) return null;
    const proofPath = payment.proofDocument?.path || payment.paymentProof;
    // Handle both relative and absolute paths
    if (proofPath.startsWith('http')) return proofPath;
    return `http://localhost:5000/${proofPath.replace(/^\//, '')}`;
  };

  const proofUrl = getProofUrl();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content process-payout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review Payment</h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <Alert type="error" closable onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Workflow Steps */}
          <div className="workflow-info">
            <div className="workflow-step">
              <div className="step-number" style={{ background: '#22c55e', color: 'white' }}>✓</div>
              <div className="step-content">
                <div className="step-title">Payment Submitted</div>
                <div className="step-desc">Member has submitted payment details</div>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number active">2</div>
              <div className="step-content">
                <div className="step-title">Admin Review</div>
                <div className="step-desc">You are here - Review and approve/reject</div>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <div className="step-title">Confirmation</div>
                <div className="step-desc">Payment confirmed and recorded</div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="payout-info">
            <h3>Payment Details</h3>
            <div className="info-grid">
              <div>
                <span className="label">Group</span>
                <span className="value">{payment.group?.name || 'Unknown'}</span>
              </div>
              <div>
                <span className="label">Cycle</span>
                <span className="value">Cycle {payment.cycle?.cycleNumber || payment.cycleNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="label">Member</span>
                <span className="value">{payment.member?.user?.name || 'Unknown'}</span>
              </div>
              <div>
                <span className="label">Amount</span>
                <span className="value" style={{ color: '#16a34a', fontSize: '18px' }}>₹{payment.amount?.toLocaleString()}</span>
              </div>
              <div>
                <span className="label">Payment Mode</span>
                <span className="value">{payment.paymentMode?.toUpperCase() || 'N/A'}</span>
              </div>
              <div>
                <span className="label">Transaction ID</span>
                <span className="value">{payment.transactionId || 'Not provided'}</span>
              </div>
              <div>
                <span className="label">Submitted On</span>
                <span className="value">{new Date(payment.createdAt).toLocaleString()}</span>
              </div>
              {payment.referenceNumber && (
                <div>
                  <span className="label">Reference Number</span>
                  <span className="value">{payment.referenceNumber}</span>
                </div>
              )}
            </div>

            {payment.memberRemarks && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #bbf7d0' }}>
                <span className="label">Member Remarks</span>
                <p style={{ margin: '8px 0 0', color: '#166534' }}>{payment.memberRemarks}</p>
              </div>
            )}
          </div>

          {/* Payment Proof */}
          {proofUrl && (
            <div className="proof-section" style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Payment Proof</h4>
              <div style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                padding: '16px',
                textAlign: 'center'
              }}>
                <img 
                  src={proofUrl} 
                  alt="Payment Proof" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <p style={{ display: 'none', color: '#64748b', margin: '8px 0 0' }}>
                  Unable to load image. <a href={proofUrl} target="_blank" rel="noopener noreferrer">View file</a>
                </p>
              </div>
            </div>
          )}

          {/* Admin Remarks */}
          <div className="form-group">
            <label htmlFor="adminRemarks">Admin Remarks</label>
            <textarea
              id="adminRemarks"
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              placeholder="Add your remarks (required for rejection)"
              rows="3"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Info Box */}
          <div className="info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>Review the payment details and proof carefully. Approving will confirm the payment, rejecting will notify the member to resubmit.</p>
          </div>

          {/* Footer Buttons */}
          <div className="modal-footer">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="danger" 
              onClick={handleReject} 
              disabled={loading}
              style={{ backgroundColor: '#f87171', borderColor: '#f87171', color: 'white' }}
            >
              {loading && action === 'reject' ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button 
              type="button" 
              variant="success" 
              onClick={handleApprove} 
              disabled={loading}
              style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}
            >
              {loading && action === 'approve' ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentApprovalModal;
