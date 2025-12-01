import React, { useState, useEffect } from 'react';
import { Button, Alert } from '../../../common';
import payoutService from '../../../../services/payoutService';
import './ProcessPayoutModal.css';

/**
 * ProcessPayoutModal - Admin initiates payout (sends to pending_approval)
 */
const ProcessPayoutModal = ({ isOpen, onClose, cycle, group, onSuccess }) => {
  const [amount, setAmount] = useState(cycle?.collectedAmount || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cycle) {
      setAmount(cycle.collectedAmount || 0);
    }
  }, [cycle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      await payoutService.initiatePayout({
        cycleId: cycle._id,
        groupId: group?._id || cycle?.groupId,
        amount: parseFloat(amount),
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to initiate payout');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content process-payout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Process Payout</h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <Alert type="error" closable onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="workflow-info">
            <div className="workflow-step">
              <div className="step-number active">1</div>
              <div className="step-content">
                <div className="step-title">Initiate Payout</div>
                <div className="step-desc">You are here - Start the payout process</div>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <div className="step-title">Beneficiary Approval</div>
                <div className="step-desc">Member reviews and approves</div>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <div className="step-title">Complete Transfer</div>
                <div className="step-desc">Transfer funds and upload proof</div>
              </div>
            </div>
          </div>

          {cycle && (
            <div className="payout-info">
              <h3>Payout Details</h3>
              <div className="info-grid">
                <div>
                  <span className="label">Group:</span>
                  <span className="value">{cycle.groupName || group?.name}</span>
                </div>
                <div>
                  <span className="label">Cycle:</span>
                  <span className="value">Cycle {cycle.cycleNumber}</span>
                </div>
                <div>
                  <span className="label">Beneficiary:</span>
                  <span className="value">{cycle.beneficiary}</span>
                </div>
                <div>
                  <span className="label">Collected Amount:</span>
                  <span className="value">₹{cycle.collectedAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="amount">Payout Amount *</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter payout amount"
              required
              min="1"
              step="1"
            />
            <small className="form-hint">This amount will be sent to the beneficiary for approval</small>
          </div>

          <div className="info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>Once you initiate this payout, the beneficiary will receive a notification to approve it. After approval, you can complete the transfer.</p>
          </div>

          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Processing...' : 'Initiate Payout'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessPayoutModal;
