// src/hooks/usePayments.js
// Member 3: Payment & Cycle Management

import { useContext } from 'react';
import { PaymentContext } from '../context/PaymentContext';

/**
 * Custom hook to use Payment Context
 */
export const usePayments = () => {
  const context = useContext(PaymentContext);
  
  if (!context) {
    throw new Error('usePayments must be used within PaymentProvider');
  }
  
  return context;
};