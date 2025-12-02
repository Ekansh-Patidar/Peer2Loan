import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert, Loader, Input } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import usePayouts from '../../hooks/usePayouts';
import { useGroups } from '../../hooks/useGroups';
import '../Groups/Groups.css';

const TRANSFER_MODES = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' }
];

const PayoutManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { executePayout, loading } = usePayouts();
  const { fetchGroupById, currentGroup, fetchGroupMembers, groupMembers } = useGroups();
  
  const groupId = searchParams.get('groupId');
  const cycleId = searchParams.get('cycleId');
  
  const [formData, setFormData] = useState({
    cycleId: cycleId || '',
    amount: '',
    transferMode: 'bank_transfer',
    transferReference: '',
    transactionId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    recipientAccount: {
      accountType: 'bank',
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: ''
    },
    processorRemarks: ''
  });
  
  const [payoutProofFile, setPayoutProofFile] = useState(null);
  const [error, setError] = useState('');
  const [beneficiary, setBeneficiary] = useState(null);

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchGroupMembers(groupId);
    }
  }, [groupId, fetchGroupById, fetchGroupMembers]);

  useEffect(() => {
    if (currentGroup && groupMembers.length > 0) {
      const currentTurn = currentGroup.currentCycle || 1;
      const currentBeneficiary = groupMembers.find(m => m.turnNumber === currentTurn);
      setBeneficiary(currentBeneficiary);
      
      if (currentGroup.monthlyContribution && currentGroup.memberCount) {
        const totalPot = currentGroup.monthlyContribution * currentGroup.memberCount;
        setFormData(prev => ({
          ...prev,
          amount: totalPot,
          recipientAccount: {
            ...prev.recipientAccount,
            accountHolderName: currentBeneficiary?.user?.name || ''
          }
        }));
      }
    }
  }, [currentGroup, groupMembers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPayoutProofFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const payoutFormData = new FormData();
      
      payoutFormData.append('cycleId', formData.cycleId);
      payoutFormData.append('amount', formData.amount);
      payoutFormData.append('transferMode', formData.transferMode);
      payoutFormData.append('transferReference', formData.transferReference);
      payoutFormData.append('transactionId', formData.transactionId);
      payoutFormData.append('scheduledDate', formData.scheduledDate);
      payoutFormData.append('processorRemarks', formData.processorRemarks);
      payoutFormData.append('recipientAccount', JSON.stringify(formData.recipientAccount));
      
      if (payoutProofFile) {
        payoutFormData.append('payoutProof', payoutProofFile);
      }

      await executePayout(payoutFormData);
      navigate(`/payouts`);
    } catch (err) {
      setError(err.message || 'Failed to execute payout');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!groupId || !cycleId) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <Alert type="error">Missing group or cycle information</Alert>
      </DashboardLayout>
    );
  }

  if (loading && !currentGroup) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader variant="spinner" size="large" text="Loading..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Button variant="outline" onClick={handleBack} style={{ marginBottom: '16px' }}>
          ← Back
        </Button>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '40px', height: '40px', color: '#6366f1' }}>
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            <div>
              <h1 style={{ margin: 0 }}>Execute Payout</h1>
              {currentGroup && (
                <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                  {currentGroup.name} - Cycle {currentGroup.currentCycle}
                </p>
              )}
            </div>
          </div>

          {error && <Alert type="error" style={{ marginBottom: '24px' }}>{error}</Alert>}

          {beneficiary && (
            <Alert type="info" style={{ marginBottom: '24px' }}>
              <strong>Beneficiary:</strong> {beneficiary.user?.name} (Turn #{beneficiary.turnNumber})
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <h3>Payout Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Payout Amount *
                </label>
                <Input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Scheduled Date *
                </label>
                <Input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Transfer Mode *
                </label>
                <select
                  name="transferMode"
                  value={formData.transferMode}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  {TRANSFER_MODES.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Transaction ID *
                </label>
                <Input
                  type="text"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleChange}
                  required
                  placeholder="Enter transaction ID"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Transfer Reference *
                </label>
                <Input
                  type="text"
                  name="transferReference"
                  value={formData.transferReference}
                  onChange={handleChange}
                  required
                  placeholder="Enter transfer reference"
                />
              </div>
            </div>

            <h3>Recipient Account Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Account Holder Name *
                </label>
                <Input
                  type="text"
                  name="recipientAccount.accountHolderName"
                  value={formData.recipientAccount.accountHolderName}
                  onChange={handleChange}
                  required
                  placeholder="Enter account holder name"
                />
              </div>

              {formData.transferMode === 'bank_transfer' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Account Number *
                    </label>
                    <Input
                      type="text"
                      name="recipientAccount.accountNumber"
                      value={formData.recipientAccount.accountNumber}
                      onChange={handleChange}
                      required
                      placeholder="Enter account number"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      IFSC Code *
                    </label>
                    <Input
                      type="text"
                      name="recipientAccount.ifscCode"
                      value={formData.recipientAccount.ifscCode}
                      onChange={handleChange}
                      required
                      placeholder="Enter IFSC code"
                    />
                  </div>
                </>
              )}

              {formData.transferMode === 'upi' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    UPI ID *
                  </label>
                  <Input
                    type="text"
                    name="recipientAccount.upiId"
                    value={formData.recipientAccount.upiId}
                    onChange={handleChange}
                    required
                    placeholder="example@upi"
                  />
                </div>
              )}
            </div>

            <h3>Additional Information</h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Processor Remarks
              </label>
              <textarea
                name="processorRemarks"
                value={formData.processorRemarks}
                onChange={handleChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                placeholder="Enter any additional remarks"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Upload Payout Proof (Optional)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'block' }}
              />
              {payoutProofFile && (
                <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                  Selected: {payoutProofFile.name}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Executing...' : 'Execute Payout'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PayoutManagement;
