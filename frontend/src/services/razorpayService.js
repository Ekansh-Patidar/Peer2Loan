/**
 * Razorpay Service - Demo Mode Integration
 * Handles Razorpay payment gateway integration using hosted checkout
 */

// Demo Razorpay credentials
const RAZORPAY_KEY_ID = "rzp_test_RmJAypyhiYvr67";

/**
 * Generate a unique order ID for demo purposes
 */
const generateOrderId = () => {
  return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Create Razorpay checkout URL and redirect
 * @param {Object} paymentDetails - Payment details
 * @param {number} paymentDetails.amount - Amount in INR
 * @param {string} paymentDetails.paymentId - Internal payment ID
 * @param {string} paymentDetails.memberName - Member name
 * @param {string} paymentDetails.description - Payment description
 * @param {string} paymentDetails.type - 'payment' or 'payout'
 * @param {string} paymentDetails.groupName - Group name
 */
const initiatePayment = (paymentDetails) => {
  const {
    amount,
    paymentId,
    memberName,
    description,
    type = 'payment',
    groupName = '',
    cycleNumber = '',
  } = paymentDetails;

  // Store payment details in sessionStorage for callback handling
  const paymentData = {
    paymentId,
    amount,
    memberName,
    description,
    type,
    groupName,
    cycleNumber,
    orderId: generateOrderId(),
    initiatedAt: new Date().toISOString(),
  };
  
  sessionStorage.setItem('razorpay_pending_payment', JSON.stringify(paymentData));

  // Create Razorpay options (without order_id for demo mode)
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amount * 100, // Razorpay expects amount in paise
    currency: 'INR',
    name: 'Peer2Loan',
    description: description || `${type === 'payout' ? 'Payout' : 'Payment'} - ${groupName}`,
    // Note: order_id is not required for test mode without backend order creation
    prefill: {
      name: memberName,
      email: 'demo@peer2loan.com',
      contact: '9999999999',
    },
    notes: {
      payment_id: paymentId,
      type: type,
      group_name: groupName,
      cycle_number: cycleNumber,
    },
    theme: {
      color: '#10b981',
    },
    // Note: UPI is only available on mobile devices in test mode
    // On desktop, Cards, Netbanking, Wallet, and Pay Later are available
  };

  // Load Razorpay script and open checkout
  loadRazorpayScript().then(() => {
    const rzp = new window.Razorpay({
      ...options,
      handler: function (response) {
        // Payment successful - redirect to success page
        handlePaymentSuccess(response, paymentData);
      },
      modal: {
        ondismiss: function () {
          // Payment cancelled
          handlePaymentCancel(paymentData);
        },
      },
    });
    rzp.open();
  }).catch((error) => {
    console.error('Failed to load Razorpay:', error);
    alert('Failed to load payment gateway. Please try again.');
  });
};

/**
 * Load Razorpay checkout script
 */
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="razorpay"]');
    if (existingScript) {
      existingScript.onload = resolve;
      existingScript.onerror = () => reject(new Error('Failed to load Razorpay script'));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    // Set timeout for loading
    const timeout = setTimeout(() => {
      reject(new Error('Razorpay script load timeout. Please check your internet connection or disable ad blockers.'));
    }, 10000);
    
    script.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load Razorpay script. Please disable ad blockers and try again.'));
    };
    document.head.appendChild(script);
  });
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = (response, paymentData) => {
  const successData = {
    ...paymentData,
    razorpay_payment_id: response.razorpay_payment_id,
    razorpay_order_id: response.razorpay_order_id || paymentData.orderId,
    razorpay_signature: response.razorpay_signature || 'demo_signature',
    status: 'success',
    completedAt: new Date().toISOString(),
  };
  
  sessionStorage.setItem('razorpay_payment_result', JSON.stringify(successData));
  sessionStorage.removeItem('razorpay_pending_payment');
  
  // Redirect to callback page
  const callbackUrl = paymentData.type === 'payout' 
    ? '/payouts/callback' 
    : '/payments/callback';
  window.location.href = callbackUrl + '?status=success';
};

/**
 * Handle payment cancellation
 */
const handlePaymentCancel = (paymentData) => {
  const cancelData = {
    ...paymentData,
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  };
  
  sessionStorage.setItem('razorpay_payment_result', JSON.stringify(cancelData));
  sessionStorage.removeItem('razorpay_pending_payment');
  
  // Redirect to callback page
  const callbackUrl = paymentData.type === 'payout' 
    ? '/payouts/callback' 
    : '/payments/callback';
  window.location.href = callbackUrl + '?status=cancelled';
};

/**
 * Get payment result from session storage
 */
const getPaymentResult = () => {
  const result = sessionStorage.getItem('razorpay_payment_result');
  return result ? JSON.parse(result) : null;
};

/**
 * Clear payment result from session storage
 */
const clearPaymentResult = () => {
  sessionStorage.removeItem('razorpay_payment_result');
  sessionStorage.removeItem('razorpay_pending_payment');
};

/**
 * Verify payment (demo mode - always returns true for successful payments)
 */
const verifyPayment = (paymentResult) => {
  // In demo mode, we trust the client-side response
  // In production, this should verify with backend using razorpay_signature
  return paymentResult && paymentResult.status === 'success';
};

const razorpayService = {
  initiatePayment,
  getPaymentResult,
  clearPaymentResult,
  verifyPayment,
  RAZORPAY_KEY_ID,
};

export default razorpayService;
