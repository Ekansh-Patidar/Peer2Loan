import React, { useState, useEffect } from 'react';
import { Button, Alert } from '../../../common';
import api from '../../../../services/api';
import './ExecutePayoutModal.css';

const ExecutePayoutModal = ({ isOpen, onClose, cycle, group, onSuccess }) => {
  const [formData, setFormData] = useState({
    cycleId: cycle?._id || '',
    amount: cycle?.collectedAmount || group?.potAmount || '',
    transferMode: 'bank_transfer',
    transferReference: '',
    transactionId: '',
    recipientAccount: {
      accountType: '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
      accountHolderName: '',
    },
    processorRemarks: '',
    payoutProof: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cycle && group) {
      setFormData(prev => ({
        ...prev,
        cycleId: cycle._id,
        amount: cycle.collectedAmount || group.potAmount,
      }));
    }
  }, [cycle, group]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('recipientAccount.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        recipientAccount: {
          ...prev.recipientAccount,
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, payoutProof: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.cycleId) {
      setError('Cycle ID is required');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append('groupId', group?._id || cycle?.groupId);
      submitData.append('cycleId', formData.cycleId);
      submitData.append('amount', Math.round(parseFloat(formData.amount) * 100) / 100);
      submitData.append('transferMode', formData.transferMode);
      
      if (formData.transferReference) {
        submitData.append('transferReference', formData.transferReference);
      }
      if (formData.transactionId) {
        submitData.append('transactionId', formData.transactionId);
      }
      if (formData.processorRemarks) {
        submitData.append('processorRemarks', formData.processorRemarks);
      }

      // Add recipient account details
      if (formData.recipientAccount.accountType) {
        submitData.append('recipientAccount', JSON.stringify(formData.recipientAccount));
      }

      if (formData.payoutProof) {
        submitData.append('payoutProof', formData.payoutProof);
      }

      const response = await api.post('/payouts', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (onSuccess) {
        onSuccess(response.data);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to execute payout');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content execute-payout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Execute Payout</h2>
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

          {cycle && (
            <div className="payout-info">
              <h3>Payout Details</h3>
              <div className="info-grid">
                <div>
                  <span className="label">Cycle:</span>
                  <span className="value">Cycle {cycle.cycleNumber}</span>
                </div>
                <div>
                  <span className="label">Beneficiary:</span>
                  <span className="value">{cycle.beneficiary?.user?.name || 'Unknown'}</span>
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
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter payout amount"
              required
              min="1"
              step="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="transferMode">Transfer Mode *</label>
            <select
              id="transferMode"
              name="transferMode"
              value={formData.transferMode}
              onChange={handleChange}
              required
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="transactionId">Transaction ID</label>
            <input
              type="text"
              id="transactionId"
              name="transactionId"
              value={formData.transactionId}
              onChange={handleChange}
              placeholder="Enter transaction ID"
            />
          </div>

          <div className="form-group">
            <label htmlFor="transferReference">Transfer Reference</label>
            <input
              type="text"
              id="transferReference"
              name="transferReference"
              value={formData.transferReference}
              onChange={handleChange}
              placeholder="Enter transfer reference"
            />
          </div>

          <div className="form-section">
            <h4>Recipient Account Details (Optional)</h4>
            
            <div className="form-group">
              <label htmlFor="recipientAccount.accountType">Account Type</label>
              <select
                id="recipientAccount.accountType"
                name="recipientAccount.accountType"
                value={formData.recipientAccount.accountType}
                onChange={handleChange}
              >
                <option value="">-- Select --</option>
                <option value="bank">Bank Account</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            {formData.recipientAccount.accountType === 'bank' && (
              <>
                <div className="form-group">
                  <label htmlFor="recipientAccount.accountHolderName">Account Holder Name</label>
                  <input
                    type="text"
                    id="recipientAccount.accountHolderName"
                    name="recipientAccount.accountHolderName"
                    value={formData.recipientAccount.accountHolderName}
                    onChange={handleChange}
                    placeholder="Enter account holder name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="recipientAccount.accountNumber">Account Number</label>
                  <input
                    type="text"
                    id="recipientAccount.accountNumber"
                    name="recipientAccount.accountNumber"
                    value={formData.recipientAccount.accountNumber}
                    onChange={handleChange}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="recipientAccount.ifscCode">IFSC Code</label>
                  <input
                    type="text"
                    id="recipientAccount.ifscCode"
                    name="recipientAccount.ifscCode"
                    value={formData.recipientAccount.ifscCode}
                    onChange={handleChange}
                    placeholder="Enter IFSC code"
                  />
                </div>
              </>
            )}

            {formData.recipientAccount.accountType === 'upi' && (
              <div className="form-group">
                <label htmlFor="recipientAccount.upiId">UPI ID</label>
                <input
                  type="text"
                  id="recipientAccount.upiId"
                  name="recipientAccount.upiId"
                  value={formData.recipientAccount.upiId}
                  onChange={handleChange}
                  placeholder="Enter UPI ID"
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="payoutProof">Payout Proof (Optional)</label>
            <input
              type="file"
              id="payoutProof"
              name="payoutProof"
              onChange={handleFileChange}
              accept="image/*,.pdf"
            />
            <small className="form-hint">Upload screenshot or receipt (Max 5MB)</small>
          </div>

          <div className="form-group">
            <label htmlFor="processorRemarks">Remarks (Optional)</label>
            <textarea
              id="processorRemarks"
              name="processorRemarks"
              value={formData.processorRemarks}
              onChange={handleChange}
              placeholder="Add any remarks..."
              rows="3"
            />
          </div>

          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Processing...' : 'Execute Payout'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExecutePayoutModal;
