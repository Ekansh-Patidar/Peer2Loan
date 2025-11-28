import React, { useState } from 'react';
import { Button, Alert } from '../../../common';
import './UpiPayment.css';

const UpiPayment = ({ amount, recipientUpi, recipientName, onPaymentInitiated, onCancel }) => {
  const [selectedApp, setSelectedApp] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Generate UPI payment string
  const generateUpiString = () => {
    const params = new URLSearchParams({
      pa: recipientUpi, // Payee address (UPI ID)
      pn: recipientName, // Payee name
      am: amount.toString(), // Amount
      cu: 'INR', // Currency
      tn: `Payment for Peer2Loan contribution`, // Transaction note
    });
    return `upi://pay?${params.toString()}`;
  };

  // UPI apps with their deep link schemes
  const upiApps = [
    { 
      id: 'gpay', 
      name: 'Google Pay', 
      scheme: 'gpay://upi/pay',
      icon: '💳',
      color: '#4285f4'
    },
    { 
      id: 'phonepe', 
      name: 'PhonePe', 
      scheme: 'phonepe://pay',
      icon: '📱',
      color: '#5f259f'
    },
    { 
      id: 'paytm', 
      name: 'Paytm', 
      scheme: 'paytmmp://pay',
      icon: '💰',
      color: '#00baf2'
    },
    { 
      id: 'bhim', 
      name: 'BHIM', 
      scheme: 'bhim://pay',
      icon: '🏦',
      color: '#097bed'
    },
    { 
      id: 'other', 
      name: 'Other UPI App', 
      scheme: generateUpiString(),
      icon: '📲',
      color: '#666'
    },
  ];

  const handleAppSelect = (app) => {
    setSelectedApp(app);
    
    // Try to open the UPI app
    const upiLink = app.id === 'other' ? app.scheme : `${app.scheme}?${generateUpiString().split('?')[1]}`;
    
    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = upiLink;
    link.click();
    
    // Show manual entry form after attempting to open app
    setTimeout(() => {
      setShowManualEntry(true);
    }, 1000);
  };

  const handleSubmitTransaction = () => {
    if (!transactionId.trim()) {
      alert('Please enter the transaction ID');
      return;
    }

    onPaymentInitiated({
      paymentMode: 'upi',
      transactionRef: transactionId,
      upiApp: selectedApp?.name,
      amount: amount,
    });
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(recipientUpi);
    alert('UPI ID copied to clipboard!');
  };

  return (
    <div className="upi-payment">
      <div className="upi-payment-header">
        <h3>Pay via UPI</h3>
        <p className="upi-amount">₹{amount.toLocaleString()}</p>
      </div>

      <div className="upi-recipient">
        <div className="upi-recipient-info">
          <span className="label">Pay to:</span>
          <span className="value">{recipientName}</span>
        </div>
        <div className="upi-recipient-info">
          <span className="label">UPI ID:</span>
          <div className="upi-id-container">
            <span className="value">{recipientUpi}</span>
            <button className="copy-btn" onClick={copyUpiId} title="Copy UPI ID">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {!showManualEntry ? (
        <>
          <div className="upi-apps-section">
            <p className="section-title">Select your UPI app:</p>
            <div className="upi-apps-grid">
              {upiApps.map((app) => (
                <button
                  key={app.id}
                  className={`upi-app-btn ${selectedApp?.id === app.id ? 'selected' : ''}`}
                  onClick={() => handleAppSelect(app)}
                  style={{ '--app-color': app.color }}
                >
                  <span className="app-icon">{app.icon}</span>
                  <span className="app-name">{app.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="upi-manual-option">
            <button 
              className="manual-entry-btn"
              onClick={() => setShowManualEntry(true)}
            >
              Already paid? Enter transaction ID
            </button>
          </div>
        </>
      ) : (
        <div className="upi-manual-entry">
          <Alert type="info">
            After completing the payment in your UPI app, please enter the transaction ID below.
          </Alert>

          <div className="form-group">
            <label htmlFor="transactionId">UPI Transaction ID / Reference Number *</label>
            <input
              type="text"
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g., 123456789012"
              className="transaction-input"
            />
            <small className="form-hint">
              You can find this in your UPI app's transaction history
            </small>
          </div>

          <div className="upi-actions">
            <Button 
              variant="ghost" 
              onClick={() => setShowManualEntry(false)}
            >
              Back
            </Button>
            <Button 
              variant="success" 
              onClick={handleSubmitTransaction}
              disabled={!transactionId.trim()}
            >
              Confirm Payment
            </Button>
          </div>
        </div>
      )}

      {!showManualEntry && (
        <div className="upi-footer">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default UpiPayment;
