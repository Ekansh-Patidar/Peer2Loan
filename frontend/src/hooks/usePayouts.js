import { useContext } from 'react';
import { PaymentContext } from '../context/PaymentContext';

export const usePayouts = () => {
  const context = useContext(PaymentContext);
  
  if (!context) {
    throw new Error('usePayouts must be used within PaymentProvider');
  }
  return {
    payouts: context.payouts,
    currentPayout: context.currentPayout,
    loading: context.loading,
    error: context.error,
    executePayout: context.executePayout,
    fetchPayoutById: context.fetchPayoutById,
    fetchGroupPayouts: context.fetchGroupPayouts,
    completePayout: context.completePayout,
    cancelPayout: context.cancelPayout,
    clearCurrentPayout: context.clearCurrentPayout,
  };
};