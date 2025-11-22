import React, { useState, useEffect } from 'react';
import { Button, Alert, Loader } from '../../../common';
import api from '../../../../services/api';
import './RecordPaymentModal.css';

const RecordPaymentModal = ({ isOpen, onClose, groupId, cycleId, amount, onSuccess }) => {
  const [formData, setFormData] = useState({
    groupId: groupId || '',
    cycleId: cycleId || '',
    amount: amount || '',
    paymentMode: 'upi',
    transactionRef: '',
    paymentProof: null,
    notes: '',
  });
  const [groups, setGroups] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's groups
  useEffect(() => {
    if (isOpen && !groupId) {
      fetchGroups();
    }
  }, [isOpen, groupId]);

  // Fetch cycles when group is selected
  useEffect(() => {
    if (formData.groupId && !cycleId) {
      fetchCycles(formData.groupId);
    }
  }, [formData.groupId, cycleId]);

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await api.get('/groups');
      setGroups(response.data?.groups || []);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchCycles = async (selectedGroupId) => {
    try {
      setLoadingCycles(true);
      // Fetch active cycle for the group
      const response = await api.get(`/dashboard/group/${selectedGroupId}`);
      const activeCycle = response.data?.activeCycle;
      if (activeCycle) {
        setCycles([{
          _id: activeCycle.cycleNumber,
          cycleNumber: activeCycle.cycleNumber,
          startDate: activeCycle.startDate,
          endDate: activeCycle.endDate,
        }]);
        // Auto-select the active cycle
        setFormData(prev => ({ ...prev, cycleId: activeCycle.cycleNumber }));
      }
    } catch (err) {
      console.error('Failed to fetch cycles:', err);
    } finally {
      setLoadingCycles(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFormData((prev) => ({ ...prev, paymentProof: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.groupId || !formData.cycleId) {
      setError('Please select a group and cycle');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('groupId', formData.groupId);
      submitData.append('cycleId', formData.cycleId);
      submitData.append('amount', formData.amount);
      submitData.append('paymentMode', formData.paymentMode);
      submitData.append('transactionRef', formData.transactionRef);
      submitData.append('notes', formData.notes);
      
      if (formData.paymentProof) {
        submitData.append('paymentProof', formData.paymentProof);
      }

      const response = await api.post('/payments', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (onSuccess) {
        onSuccess(response.data);
      }
      
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content record-payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Record Payment</h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

          {!groupId && (
            <div className="form-group">
              <label htmlFor="groupId">Select Group *</label>
              {loadingGroups ? (
                <Loader size="small" text="Loading groups..." />
              ) : (
                <select
                  id="groupId"
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select a group --</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {!cycleId && formData.groupId && (
            <div className="form-group">
              <label htmlFor="cycleId">Cycle *</label>
              {loadingCycles ? (
                <Loader size="small" text="Loading cycles..." />
              ) : cycles.length > 0 ? (
                <select
                  id="cycleId"
                  name="cycleId"
                  value={formData.cycleId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select a cycle --</option>
                  {cycles.map((cycle) => (
                    <option key={cycle._id} value={cycle._id}>
                      Cycle {cycle.cycleNumber} ({new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              ) : (
                <Alert type="info">No active cycle found for this group</Alert>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="amount">Amount *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              required
              min="1"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="paymentMode">Payment Mode *</label>
            <select
              id="paymentMode"
              name="paymentMode"
              value={formData.paymentMode}
              onChange={handleChange}
              required
            >
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="transactionRef">Transaction Reference</label>
            <input
              type="text"
              id="transactionRef"
              name="transactionRef"
              value={formData.transactionRef}
              onChange={handleChange}
              placeholder="UPI ID, Transaction ID, Cheque No., etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="paymentProof">Payment Proof (Optional)</label>
            <input
              type="file"
              id="paymentProof"
              name="paymentProof"
              onChange={handleFileChange}
              accept="image/*,.pdf"
            />
            <small className="form-hint">Upload screenshot or receipt (Max 5MB)</small>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes..."
              rows="3"
            />
          </div>

          <div className="modal-footer">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
