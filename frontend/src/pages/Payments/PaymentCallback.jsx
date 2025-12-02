import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, Alert, Loader } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import { usePayments } from '../../hooks/usePayments';
import razorpayService from '../../services/razorpayService';
import api from '../../services/api';

/**
 * PaymentCallback - Handles Razorpay payment callback
 * Flow: Pay Now → Razorpay → Auto-submit for Admin Approval
 */
const PaymentCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { fetchMyPayments } = usePayments();
  
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submittedForApproval, setSubmittedForApproval] = useState(false);
  
  // Ref to prevent duplicate processing
  const hasProcessed = useRef(false);

  useEffect(() => {
    const processPaymentResult = async () => {
      // Prevent duplicate processing
      if (hasProcessed.current) return;
      hasProcessed.current = true;
      
      try {
        const status = searchParams.get('status');
        const paymentResult = razorpayService.getPaymentResult();

        if (!paymentResult) {
          setError('No payment data found. Please try again.');
          setProcessing(false);
          return;
        }

        setResult(paymentResult);

        if (status === 'success' && razorpayService.verifyPayment(paymentResult)) {
          // Update payment status and auto-submit for admin approval
          try {
            if (paymentResult.paymentId && !paymentResult.paymentId.startsWith('demo_') && !paymentResult.paymentId.startsWith('manual_')) {
              // Update existing payment with Razorpay details - this will set status to under_review
              // Call API directly to avoid duplicate calls from context
              await api.put(`/payments/${paymentResult.paymentId}`, {
                status: 'paid',
                razorpayPaymentId: paymentResult.razorpay_payment_id,
                razorpayOrderId: paymentResult.razorpay_order_id,
                paidAt: paymentResult.completedAt,
                paymentMode: 'razorpay',
                transactionId: paymentResult.razorpay_payment_id,
              });
              setSubmittedForApproval(true);
            }
            // Refresh payments list
            await fetchMyPayments();
          } catch (updateError) {
            console.error('Failed to update payment:', updateError);
            // Still show success since payment was made
          }
        }

        setProcessing(false);
      } catch (err) {
        console.error('Error processing payment result:', err);
        setError('Failed to process payment result');
        setProcessing(false);
      }
    };

    processPaymentResult();
  }, [searchParams]);

  const handleGoToPayments = () => {
    razorpayService.clearPaymentResult();
    navigate('/payments');
  };

  const handleRetryPayment = () => {
    razorpayService.clearPaymentResult();
    navigate('/payments');
  };

  if (processing) {
    return (
      <DashboardLayout user={user} onLogout={logout}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader variant="spinner" size="large" text="Processing payment..." />
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
                <h2 style={{ color: '#2e7d32', marginBottom: '8px' }}>Payment Successful!</h2>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  Your payment of ₹{result?.amount?.toLocaleString()} has been processed successfully.
                </p>
                
                {/* Sent for Approval Notice */}
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', color: '#92400e', fontSize: '14px' }}>Sent for Admin Approval</div>
                    <div style={{ color: '#a16207', fontSize: '13px' }}>Your payment has been submitted and is awaiting admin verification.</div>
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
                    <span style={{ color: '#666', fontSize: '13px' }}>Group</span>
                    <div style={{ fontWeight: '600' }}>{result?.groupName || 'N/A'}</div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>Status</span>
                    <div style={{ fontWeight: '600', color: '#f59e0b' }}>Under Review</div>
                  </div>
                  <div>
                    <span style={{ color: '#666', fontSize: '13px' }}>Date & Time</span>
                    <div style={{ fontWeight: '600' }}>
                      {result?.completedAt ? new Date(result.completedAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>

                <Button variant="success" onClick={handleGoToPayments} style={{ width: '100%', background: '#10b981', borderColor: '#10b981', color: 'white' }}>
                  Go to Payments
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
                  {result?.status === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
                </h2>
                <p style={{ color: '#666', marginBottom: '24px' }}>
                  {result?.status === 'cancelled' 
                    ? 'You cancelled the payment. No amount has been deducted.'
                    : error || 'Something went wrong with your payment. Please try again.'}
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button variant="outline" onClick={handleGoToPayments} style={{ flex: 1 }}>
                    Go Back
                  </Button>
                  <Button variant="primary" onClick={handleRetryPayment} style={{ flex: 1 }}>
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

export default PaymentCallback;
