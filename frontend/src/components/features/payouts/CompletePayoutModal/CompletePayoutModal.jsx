import React, { useState } from 'react';
import { Button, Alert } from '../../../common';
import api from '../../../../services/api';
import './CompletePayoutModal.css';

/**
 * CompletePayoutModal - Admin completes payout with transaction details
 */
const CompletePayoutModal = ({ isOpen, onClose, payout, onSuccess }) => {
  const [formData, setFormData] = useState({
    transferMode: 'bank_transfer',
    transactionId: '',
    transferReference: '',
    processorRemarks: '',
    recipientAccount: {
      accountType: '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
      accountHolderName: payout?.beneficiary?.user?.name || '',
    },
  });
  const [payoutProof, setPayoutProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('recipientAccount.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        recipientAccount: { ...prev.recipientAccount, [field]: value },
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
      setPayoutProof(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.transactionId) {
      setError('Transaction ID is required');
      return;
    }

    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append('payoutId', payout._id);
      submitData.append('groupId', payout.group?._id || payout.group);
      submitData.append('cycleId', payout.cycle?._id || payout.cycle);
      submitData.append('amount', payout.amount);
      submitData.append('transferMode', formData.transferMode);
      submitData.append('transactionId', formData.transactionId);
      
      if (formData.transferReference) {
        submitData.append('transferReference', formData.transferReference);
      }
      if (formData.processorRemarks) {
        submitData.append('processorRemarks', formData.processorRemarks);
      }
      if (formData.recipientAccount.accountType) {
        submitData.append('recipientAccount', JSON.stringify(formData.recipientAccount));
      }
      if (payoutProof) {
        submitData.append('payoutProof', payoutProof);
      }

      await api.post('/payouts', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete payout');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content complete-payout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Complete Payout</h2>
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

          <div className="approval-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <div className="badge-title">Approved by Beneficiary</div>
              <div className="badge-subtitle">
                {payout?.beneficiary?.user?.name} approved on {new Date(payout?.approvedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="payout-summary">
            <div className="summary-row">
              <span>Group</span>
              <span>{payout?.group?.name}</span>
            </div>
            <div className="summary-row">
              <span>Cycle</span>
              <span>Cycle {payout?.cycle?.cycleNumber}</span>
            </div>
            <div className="summary-row">
              <span>Beneficiary</span>
              <span>{payout?.beneficiary?.user?.name}</span>
            </div>
            <div className="summary-row amount">
              <span>Amount</span>
              <span>₹{payout?.amount?.toLocaleString()}</span>
            </div>
          </div>

          <h3>Transfer Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="transferMode">Transfer Mode *</label>
              <select id="transferMode" name="transferMode" value={formData.transferMode} onChange={handleChange} required>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="transactionId">Transaction ID *</label>
              <input type="text" id="transactionId" name="transactionId" value={formData.transactionId} onChange={handleChange} placeholder="Enter transaction ID" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="transferReference">Transfer Reference</label>
            <input type="text" id="transferReference" name="transferReference" value={formData.transferReference} onChange={handleChange} placeholder="Enter reference number" />
          </div>

          <div className="form-group">
            <label htmlFor="payoutProof">Upload Proof (Screenshot/Receipt) *</label>
            <input type="file" id="payoutProof" onChange={handleFileChange} accept="image/*,.pdf" />
            {payoutProof && <small className="file-selected">Selected: {payoutProof.name}</small>}
            <small className="form-hint">Upload screenshot or receipt of the transfer (Max 5MB)</small>
          </div>

          <div className="form-group">
            <label htmlFor="processorRemarks">Remarks (Optional)</label>
            <textarea id="processorRemarks" name="processorRemarks" value={formData.processorRemarks} onChange={handleChange} placeholder="Add any remarks for the beneficiary..." rows="3" />
          </div>

          <div className="info-box success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>Once completed, the beneficiary will be notified with the transaction details and proof document.</p>
          </div>

          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="success" disabled={loading}>
              {loading ? 'Completing...' : 'Complete Payout'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompletePayoutModal;
