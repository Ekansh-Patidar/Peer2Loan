import React, { useState, useEffect } from 'react';
import { Button, Alert, Loader } from '../../../common';
import UpiPayment from '../UpiPayment/UpiPayment';
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
  const [showUpiPayment, setShowUpiPayment] = useState(false);
  const [organizerUpi, setOrganizerUpi] = useState(null);

  // Fetch user's groups
  useEffect(() => {
    if (isOpen && !groupId) {
      fetchGroups();
    }
  }, [isOpen, groupId]);

  // Sync props with state when they change
  useEffect(() => {
    if (groupId) {
      setFormData(prev => ({ ...prev, groupId }));
    }
    if (cycleId) {
      setFormData(prev => ({ ...prev, cycleId }));
    }
    if (amount) {
      setFormData(prev => ({ ...prev, amount }));
    }
  }, [groupId, cycleId, amount]);

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
      console.log('Active cycle from API:', activeCycle);
      if (activeCycle) {
        const cycleData = {
          _id: activeCycle._id,
          cycleNumber: activeCycle.cycleNumber,
          startDate: activeCycle.startDate,
          endDate: activeCycle.endDate,
        };
        console.log('Setting cycles array:', [cycleData]);
        console.log('Cycle _id:', cycleData._id);
        setCycles([cycleData]);

        // Auto-select the active cycle after a small delay to ensure cycles are set
        setTimeout(() => {
          console.log('Auto-selecting cycle ID:', activeCycle._id);
          setFormData(prev => {
            const updated = { ...prev, cycleId: activeCycle._id };
            console.log('Updated formData after timeout:', updated);
            return updated;
          });
        }, 100);
      }

      // Fetch group details to get organizer UPI and monthly contribution
      const groupResponse = await api.get(`/groups/${selectedGroupId}`);
      const group = groupResponse.data?.group;

      console.log('=== FETCHING PAYMENT AMOUNT ===');
      console.log('Active Cycle:', activeCycle);
      console.log('Selected Group ID:', selectedGroupId);
      console.log('Monthly Contribution from Group:', group?.monthlyContribution);

      // Fetch the actual payment record for this member in the active cycle
      // This will include any penalties added to the base amount
      if (activeCycle?._id) {
        try {
          console.log('Fetching member dashboard for group:', selectedGroupId);
          const memberDashboard = await api.get(`/dashboard/member/${selectedGroupId}`);
          console.log('Member Dashboard Response:', memberDashboard.data);

          const financials = memberDashboard.data?.financials;
          console.log('Financials:', financials);
          console.log('Unpaid Penalties from Financials:', financials?.unpaidPenalties);

          // Use unpaid penalties from financials (only unpaid penalties for THIS member)
          const monthlyContribution = group?.monthlyContribution || 0;
          const unpaidPenalties = financials?.unpaidPenalties || 0;
          const totalAmount = monthlyContribution + unpaidPenalties;

          const amountToSet = Math.round(totalAmount).toString();
          console.log('Monthly Contribution:', monthlyContribution);
          console.log('Unpaid Penalties (from financials):', unpaidPenalties);
          console.log('Total Amount (Contribution + Unpaid Penalties):', totalAmount);
          console.log('Setting amount to:', amountToSet);

          setFormData(prev => {
            const updated = {
              ...prev,
              amount: amountToSet
            };
            console.log('Updated formData:', updated);
            return updated;
          });
        } catch (err) {
          console.error('Failed to fetch payment details:', err);
          console.error('Error details:', err.response?.data);
          // Fallback to monthly contribution on error
          if (group?.monthlyContribution) {
            console.log('Error occurred, falling back to monthly contribution');
            setFormData(prev => ({
              ...prev,
              amount: Math.round(group.monthlyContribution).toString()
            }));
          }
        }
      } else {
        console.log('No active cycle, using monthly contribution');
        if (group?.monthlyContribution) {
          // No active cycle, use monthly contribution
          setFormData(prev => ({
            ...prev,
            amount: Math.round(group.monthlyContribution).toString()
          }));
        }
      }

      if (group?.organizer) {
        // Fetch organizer's UPI details
        const organizerResponse = await api.get(`/users/${group.organizer._id || group.organizer}`);
        setOrganizerUpi({
          upiId: organizerResponse.data?.user?.upiId || 'organizer@upi',
          name: organizerResponse.data?.user?.name || group.organizer.name || 'Group Organizer'
        });
      }
    } catch (err) {
      console.error('Failed to fetch cycles:', err);
    } finally {
      setLoadingCycles(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Field changed:', name, '=', value);
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

  const handleUpiPayment = () => {
    if (!formData.groupId || !formData.cycleId) {
      setError('Please select a group and cycle');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setShowUpiPayment(true);
  };

  const handleUpiPaymentInitiated = async (upiData) => {
    setFormData(prev => ({
      ...prev,
      paymentMode: upiData.paymentMode,
      transactionRef: upiData.transactionRef,
      notes: prev.notes + (prev.notes ? '\n' : '') + `Paid via ${upiData.upiApp}`
    }));

    // Submit the payment
    await handleSubmit(null, upiData);
  };

  const handleSubmit = async (e, upiData = null) => {
    if (e) e.preventDefault();
    setError(null);

    console.log('=== SUBMIT HANDLER ===');
    console.log('Form data:', formData);
    console.log('Form data.groupId:', formData.groupId);
    console.log('Form data.cycleId:', formData.cycleId);
    console.log('UPI data:', upiData);
    console.log('Props - groupId:', groupId, 'cycleId:', cycleId);

    if (!formData.groupId || !formData.cycleId) {
      console.error('Validation failed - missing groupId or cycleId');
      setError(`Please select a group and cycle. GroupId: ${formData.groupId}, CycleId: ${formData.cycleId}`);
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Validate transaction reference (required)
    const transactionId = upiData?.transactionRef || formData.transactionRef;
    if (!transactionId || !transactionId.trim()) {
      setError('Transaction ID / Reference is required');
      return;
    }

    // Validate payment proof (required)
    if (!formData.paymentProof) {
      setError('Payment proof is required. Please upload a screenshot or receipt.');
      return;
    }

    try {
      setLoading(true);

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('groupId', formData.groupId);
      submitData.append('cycleId', formData.cycleId);

      // Log the raw amount value
      console.log('Raw amount from form:', formData.amount, 'Type:', typeof formData.amount);

      // Simply use the amount as-is (it's already a string from the input)
      // Ensure we send a clean integer string
      const amountValue = String(formData.amount).replace(/[^0-9]/g, '');
      console.log('Amount being sent:', amountValue);
      submitData.append('amount', amountValue);
      submitData.append('paymentMode', upiData?.paymentMode || formData.paymentMode);

      // Only add transactionId if it has a value
      const transactionId = upiData?.transactionRef || formData.transactionRef;
      if (transactionId && transactionId.trim()) {
        submitData.append('transactionId', transactionId);
      }

      // Only add memberRemarks if it has a value
      if (formData.notes && formData.notes.trim()) {
        submitData.append('memberRemarks', formData.notes);
      }

      if (formData.paymentProof) {
        submitData.append('paymentProof', formData.paymentProof);
      }

      // Log what we're sending
      console.log('Submitting payment with data:');
      for (let [key, value] of submitData.entries()) {
        console.log(`  ${key}:`, value);
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
      console.error('Payment submission error:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error message:', err.message);

      const errorMessage = err.response?.data?.message
        || err.response?.data?.error
        || err.message
        || 'Failed to record payment';

      setError(errorMessage);
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

        {showUpiPayment && organizerUpi ? (
          <div className="modal-body">
            <UpiPayment
              amount={parseInt(formData.amount, 10)}
              recipientUpi={organizerUpi.upiId}
              recipientName={organizerUpi.name}
              onPaymentInitiated={handleUpiPaymentInitiated}
              onCancel={() => setShowUpiPayment(false)}
            />
          </div>
        ) : (
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
                step="1"
              />
            </div>

            {formData.groupId && formData.cycleId && formData.amount && organizerUpi && (
              <div className="upi-quick-pay">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleUpiPayment}
                  style={{ width: '100%', marginBottom: '16px' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  Pay ₹{formData.amount} with UPI
                </Button>
                <div style={{ textAlign: 'center', margin: '16px 0', color: '#666', fontSize: '14px' }}>
                  OR enter payment details manually
                </div>
              </div>
            )}

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
              <label htmlFor="transactionRef">Transaction ID / Reference *</label>
              <input
                type="text"
                id="transactionRef"
                name="transactionRef"
                value={formData.transactionRef}
                onChange={handleChange}
                placeholder="UPI Transaction ID, Bank Ref No., Cheque No., etc."
                required
              />
              <small className="form-hint">Required for verification by admin</small>
            </div>

            <div className="form-group">
              <label htmlFor="paymentProof">Payment Proof *</label>
              <input
                type="file"
                id="paymentProof"
                name="paymentProof"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                required={!formData.paymentProof}
              />
              <small className="form-hint">Upload screenshot or receipt (Max 5MB) - Required</small>
              {formData.paymentProof && (
                <small className="form-hint" style={{ color: '#16a34a' }}>
                  ✓ File selected: {formData.paymentProof.name}
                </small>
              )}
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
        )}
      </div>
    </div>
  );
};

export default RecordPaymentModal;
