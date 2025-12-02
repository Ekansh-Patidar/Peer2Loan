import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import razorpayService from '../../services/razorpayService';
import payoutService from '../../services/payoutService';

/**
 * PayoutCallback - Handles Razorpay payout callback
 * Flow: After successful payment, auto-complete the payout
 */
const PayoutCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [payoutCompleted, setPayoutCompleted] = useState(false);

  useEffect(() => {
    const processPayoutResult = async () => {
      try {
        const status = searchParams.get('status');
        const paymentResult = razorpayService.getPaymentResult();

        if (!paymentResult) {
          setError('No payout data found. Please try again.');
          setProcessing(false);
          return;
        }

        setResult(paymentResult);
        
        // If payment was successful, auto-complete the payout
        if (status === 'success' && razorpayService.verifyPayment(paymentResult)) {
          try {
            // Complete the payout with Razorpay transaction details
            await payoutService.completePayout(paymentResult.paymentId, {
              transactionId: paymentResult.razorpay_payment_id,
              reference: paymentResult.razorpay_order_id || paymentResult.razorpay_payment_id,
            });
            setPayoutCompleted(true);
          } catch (completeError) {
            console.error('Failed to complete payout:', completeError);
            setError(completeError.message || 'Failed to complete payout');
          }
        } else if (status === 'cancelled') {
          // Payment was cancelled - no action needed, payout stays in approved status
          console.log('Payout payment was cancelled');
        } else {
          // Payment failed - mark payout as failed so user can retry
          try {
            await payoutService.markPayoutFailed(paymentResult.paymentId, 'Payment failed or was declined');
          } catch (failError) {
            console.error('Failed to mark payout as failed:', failError);
          }
        }
        
        setProcessing(false);
      } catch (err) {
        console.error('Error processing payout result:', err);
        setError('Failed to process payout result');
        setProcessing(false);
      }
    };

    processPayoutResult();
  }, [searchParams]);

  const handleGoToPayouts = () => {
    razorpayService.clearPaymentResult();
    navigate('/payouts');
  };

  const handleRetryPayout = () => {
    razorpayService.clearPaymentResult();
    navigate('/payouts');
  };

  if (processing) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader variant="spinner" size="large" text="Processing payout..." />
        </div>
      </DashboardLayout>
    );
  }

  const isSuccess = result?.status === 'success';

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 16px' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '32px' }}>
            {isSuccess ? (
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#e8f5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="3" style={{ width: '40px', height: '40px' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 style={{ color: '#2e7d32', marginBottom: '8px' }}>Payout Completed!</h2>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  Payout of ₹{result?.amount?.toLocaleString()} to {result?.memberName || 'beneficiary'} has been completed successfully.
                </p>
                
                {/* Payout Completed Notice */}
                <div style={{
                  background: '#d1fae5',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', color: '#065f46', fontSize: '14px' }}>Transfer Complete</div>
                    <div style={{ color: '#047857', fontSize: '13px' }}>The payout has been marked as completed. Beneficiary has been notified.</div>
                  </div>
                </div>
                
                <div style={{
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                  textAlign: 'left',
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>Transaction ID</span>
                    <div style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                      {result?.razorpay_payment_id || 'N/A'}
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>Amount</span>
                    <div style={{ fontWeight: '600', color: '#2e7d32' }}>
                      ₹{result?.amount?.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>Beneficiary</span>
                    <div style={{ fontWeight: '600' }}>{result?.memberName || 'N/A'}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>Group</span>
                    <div style={{ fontWeight: '600' }}>{result?.groupName || 'N/A'}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>Status</span>
                    <div style={{ fontWeight: '600', color: '#10b981' }}>Completed</div>
                  </div>
                  <div>
                    <span style={{ color: '#666', fontSize: '13px' }}>Date & Time</span>
                    <div style={{ fontWeight: '600' }}>
                      {result?.completedAt ? new Date(result.completedAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>

                <Button variant="success" onClick={handleGoToPayouts} style={{ width: '100%', background: '#10b981', borderColor: '#10b981', color: 'white' }}>
                  Go to Payouts
                </Button>
              </>
            ) : (
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: result?.status === 'cancelled' ? '#fff3e0' : '#ffebee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={result?.status === 'cancelled' ? '#f57c00' : '#c62828'} strokeWidth="3" style={{ width: '40px', height: '40px' }}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <h2 style={{ color: result?.status === 'cancelled' ? '#f57c00' : '#c62828', marginBottom: '8px' }}>
                  {result?.status === 'cancelled' ? 'Payout Cancelled' : 'Payout Failed'}
                </h2>
                <p style={{ color: '#666', marginBottom: '24px' }}>
                  {result?.status === 'cancelled' 
                    ? 'You cancelled the payout process.'
                    : error || 'Something went wrong with your payout. Please try again.'}
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button variant="outline" onClick={handleGoToPayouts} style={{ flex: 1 }}>
                    Go Back
                  </Button>
                  <Button variant="primary" onClick={handleRetryPayout} style={{ flex: 1 }}>
                    Try Again
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PayoutCallback;
