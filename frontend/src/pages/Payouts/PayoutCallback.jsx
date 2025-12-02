import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import razorpayService from '../../services/razorpayService';

/**
 * PayoutCallback - Handles Razorpay payout callback
 */
const PayoutCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
        
        // Store completed demo payout ID for the dashboard to update
        if (status === 'success' && paymentResult.paymentId && paymentResult.paymentId.startsWith('demo_payout_')) {
          sessionStorage.setItem('completed_demo_payout', paymentResult.paymentId);
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
                <h2 style={{ color: '#2e7d32', marginBottom: '8px' }}>Payout Successful!</h2>
                <p style={{ color: '#666', marginBottom: '24px' }}>
                  Your payout of ₹{result?.amount?.toLocaleString()} has been processed successfully.
                </p>
                
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
                    <span style={{ color: '#666', fontSize: '13px' }}>Group</span>
                    <div style={{ fontWeight: '600' }}>{result?.groupName || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#666', fontSize: '13px' }}>Date & Time</span>
                    <div style={{ fontWeight: '600' }}>
                      {result?.completedAt ? new Date(result.completedAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>

                <Button variant="primary" onClick={handleGoToPayouts} style={{ width: '100%' }}>
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
