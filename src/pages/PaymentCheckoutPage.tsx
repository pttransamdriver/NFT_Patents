import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const PaymentCheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  const clientSecret = searchParams.get('client_secret');

  useEffect(() => {
    if (!clientSecret) {
      setPaymentStatus('error');
      setErrorMessage('Invalid payment session');
      return;
    }

    // Initialize Stripe Elements
    initializeStripePayment();
  }, [clientSecret]);

  const initializeStripePayment = async () => {
    try {
      // In a real implementation, you would:
      // 1. Load Stripe.js
      // 2. Create Elements
      // 3. Mount payment form
      // 4. Handle payment confirmation
      
      // For demo purposes, we'll simulate payment processing
      setTimeout(() => {
        // Simulate successful payment
        setPaymentStatus('success');
      }, 3000);
      
    } catch (error) {
      console.error('Payment initialization failed:', error);
      setPaymentStatus('error');
      setErrorMessage('Failed to initialize payment');
    }
  };

  const handleReturnToSearch = () => {
    navigate('/search');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              AI Search Payment
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete your payment to unlock AI-powered patent search
            </p>
          </div>

          {/* Payment Status */}
          {paymentStatus === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Processing Payment
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please wait while we process your payment...
              </p>
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </motion.div>
          )}

          {paymentStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your AI search credit has been added to your account.
              </p>
              <button
                onClick={handleReturnToSearch}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Return to Search
              </button>
            </motion.div>
          )}

          {paymentStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Payment Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {errorMessage || 'Something went wrong with your payment. Please try again.'}
              </p>
              <button
                onClick={handleReturnToSearch}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Search</span>
              </button>
            </motion.div>
          )}

          {/* Payment Details */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">AI Patent Search</span>
              <span className="font-semibold text-gray-900 dark:text-white">$15.00</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-400">Processing Fee</span>
              <span className="text-gray-900 dark:text-white">$0.00</span>
            </div>
            <div className="flex justify-between items-center font-semibold text-lg mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-gray-900 dark:text-white">$15.00</span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              🔒 Payments are securely processed by Stripe. We never store your payment information.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentCheckoutPage;
