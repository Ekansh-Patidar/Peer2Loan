// src/context/PaymentContext.jsx
// Member 3: Payment & Cycle Management
// CRITICAL FILE - DON'T SKIP THIS!

import React, { createContext, useState, useCallback } from 'react';
import paymentService from '../services/paymentService';
import payoutService from '../services/payoutService';
import useNotification from '../hooks/useNotification';

export const PaymentContext = createContext();

/**
 * Payment Context Provider
 * Manages payment and payout state
 */
export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [currentPayout, setCurrentPayout] = useState(null);
  const [cyclePayments, setCyclePayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  // ==================== PAYMENT METHODS ====================

  /**
   * Record a new payment
   */
  const recordPayment = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.recordPayment(paymentData);
      const newPayment = response.data.payment;
      
      setPayments(prev => [newPayment, ...prev]);
      setCurrentPayment(newPayment);
      
      showNotification('Payment recorded successfully!', 'success');
      return newPayment;
    } catch (err) {
      const errorMsg = err.message || 'Failed to record payment';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Get payment by ID
   */
  const fetchPaymentById = useCallback(async (paymentId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.getPaymentById(paymentId);
      const payment = response.data.payment;
      setCurrentPayment(payment);
      return payment;
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch payment';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Get payments for a cycle
   */
  const fetchCyclePayments = useCallback(async (cycleId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.getCyclePayments(cycleId);
      const payments = response.data.payments || [];
      setCyclePayments(payments);
      return payments;
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch cycle payments';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Get current user's payment history
   */
  const fetchMyPayments = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.getMyPayments(params);
      // Handle different response structures
      const paymentsData = response?.data?.payments || response?.payments || [];
      setPayments(paymentsData);
      return response?.data || response || { payments: [] };
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch payment history';
      setError(errorMsg);
      setPayments([]); // Set empty array on error
      showNotification(errorMsg, 'error');
      // Don't throw, just return empty data
      return { payments: [] };
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Get payment history for a member
   */
  const fetchMemberPayments = useCallback(async (memberId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.getMemberPayments(memberId, params);
      // Handle different response structures
      const paymentsData = response?.data?.payments || response?.payments || [];
      setPayments(paymentsData);
      return response?.data || response || { payments: [] };
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch payment history';
      setError(errorMsg);
      setPayments([]); // Set empty array on error
      showNotification(errorMsg, 'error');
      // Don't throw, just return empty data
      return { payments: [] };
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Get all payments for a group
   */
  const fetchGroupPayments = useCallback(async (groupId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.getGroupPayments(groupId, params);
      const payments = response.data.payments || [];
      setPayments(payments);
      return response.data;
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch group payments';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Confirm payment (Admin)
   */
  const confirmPayment = useCallback(async (paymentId, data = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.confirmPayment(paymentId, data);
      const updatedPayment = response.data.payment;
      
      setPayments(prev => prev.map(p => 
        p._id === paymentId ? updatedPayment : p
      ));
      
      setCyclePayments(prev => prev.map(p => 
        p._id === paymentId ? updatedPayment : p
      ));
      
      if (currentPayment?._id === paymentId) {
        setCurrentPayment(updatedPayment);
      }
      
      showNotification('Payment confirmed successfully!', 'success');
      return updatedPayment;
    } catch (err) {
      const errorMsg = err.message || 'Failed to confirm payment';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPayment, showNotification]);

  /**
   * Reject payment (Admin)
   */
  const rejectPayment = useCallback(async (paymentId, data = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.rejectPayment(paymentId, data);
      const updatedPayment = response.data.payment;
      
      setPayments(prev => prev.map(p => 
        p._id === paymentId ? updatedPayment : p
      ));
      
      setCyclePayments(prev => prev.map(p => 
        p._id === paymentId ? updatedPayment : p
      ));
      
      if (currentPayment?._id === paymentId) {
        setCurrentPayment(updatedPayment);
      }
      
      showNotification('Payment rejected', 'warning');
      return updatedPayment;
    } catch (err) {
      const errorMsg = err.message || 'Failed to reject payment';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPayment, showNotification]);

  /**
   * Update payment
   */
  const updatePayment = useCallback(async (paymentId, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.updatePayment(paymentId, updateData);
      // Handle different response structures
      const updatedPayment = response?.data?.payment || response?.payment || response;
      
      if (updatedPayment && updatedPayment._id) {
        setPayments(prev => prev.map(p => 
          p._id === paymentId ? updatedPayment : p
        ));
        
        if (currentPayment?._id === paymentId) {
          setCurrentPayment(updatedPayment);
        }
      }
      
      showNotification('Payment updated successfully!', 'success');
      return updatedPayment;
    } catch (err) {
      const errorMsg = err.message || 'Failed to update payment';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPayment, showNotification]);

  /**
   * Delete payment
   */
  const deletePayment = useCallback(async (paymentId) => {
    setLoading(true);
    setError(null);
    try {
      await paymentService.deletePayment(paymentId);
      
      setPayments(prev => prev.filter(p => p._id !== paymentId));
      setCyclePayments(prev => prev.filter(p => p._id !== paymentId));
      
      if (currentPayment?._id === paymentId) {
        setCurrentPayment(null);
      }
      
      showNotification('Payment deleted successfully', 'success');
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete payment';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPayment, showNotification]);

  // ==================== PAYOUT METHODS ====================

  /**
   * Execute a payout
   */
  const executePayout = useCallback(async (payoutData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await payoutService.executePayout(payoutData);
      const newPayout = response.data.payout;
      
      setPayouts(prev => [newPayout, ...prev]);
      setCurrentPayout(newPayout);
      
      showNotification('Payout executed successfully!', 'success');
      return newPayout;
    } catch (err) {
      const errorMsg = err.message || 'Failed to execute payout';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Get payout by ID
   */
  const fetchPayoutById = useCallback(async (payoutId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await payoutService.getPayoutById(payoutId);
      const payout = response.data.payout;
      setCurrentPayout(payout);
      return payout;
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch payout';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Get payouts for a group
   */
  const fetchGroupPayouts = useCallback(async (groupId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await payoutService.getGroupPayouts(groupId, params);
      const payouts = response.data.payouts || [];
      setPayouts(payouts);
      return response.data;
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch payouts';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Complete payout
   */
  const completePayout = useCallback(async (payoutId, data = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await payoutService.completePayout(payoutId, data);
      const updatedPayout = response.data.payout;
      
      setPayouts(prev => prev.map(p => 
        p._id === payoutId ? updatedPayout : p
      ));
      
      if (currentPayout?._id === payoutId) {
        setCurrentPayout(updatedPayout);
      }
      
      showNotification('Payout completed successfully!', 'success');
      return updatedPayout;
    } catch (err) {
      const errorMsg = err.message || 'Failed to complete payout';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPayout, showNotification]);

  /**
   * Cancel payout
   */
  const cancelPayout = useCallback(async (payoutId, reason) => {
    setLoading(true);
    setError(null);
    try {
      const response = await payoutService.cancelPayout(payoutId, reason);
      const updatedPayout = response.data.payout;
      
      setPayouts(prev => prev.map(p => 
        p._id === payoutId ? updatedPayout : p
      ));
      
      if (currentPayout?._id === payoutId) {
        setCurrentPayout(updatedPayout);
      }
      
      showNotification('Payout cancelled', 'warning');
      return updatedPayout;
    } catch (err) {
      const errorMsg = err.message || 'Failed to cancel payout';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPayout, showNotification]);

  /**
   * Clear current payment
   */
  const clearCurrentPayment = useCallback(() => {
    setCurrentPayment(null);
  }, []);

  /**
   * Clear current payout
   */
  const clearCurrentPayout = useCallback(() => {
    setCurrentPayout(null);
  }, []);

  const value = {
    // State
    payments,
    currentPayment,
    payouts,
    currentPayout,
    cyclePayments,
    loading,
    error,

    // Payment Actions
    recordPayment,
    fetchPaymentById,
    fetchCyclePayments,
    fetchMyPayments,
    fetchMemberPayments,
    fetchGroupPayments,
    confirmPayment,
    rejectPayment,
    updatePayment,
    deletePayment,
    clearCurrentPayment,

    // Payout Actions
    executePayout,
    fetchPayoutById,
    fetchGroupPayouts,
    completePayout,
    cancelPayout,
    clearCurrentPayout,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};