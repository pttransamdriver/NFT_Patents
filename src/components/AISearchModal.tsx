import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Key, Brain, Shield, Zap, DollarSign } from 'lucide-react';
import { Web3Context } from '../contexts/Web3Context';
import { paymentService } from '../services/paymentService';

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchWithUserKey: (apiKey: string) => void;
  onSearchWithPayment: () => void;
  searchQuery: string;
}

export const AISearchModal: React.FC<AISearchModalProps> = ({
  isOpen,
  onClose,
  onSearchWithUserKey,
  onSearchWithPayment,
  searchQuery
}) => {
  const [selectedOption, setSelectedOption] = useState<'user-key' | 'payment' | null>(null);
  const [userApiKey, setUserApiKey] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [searchCredits, setSearchCredits] = useState(0);
  const { account } = useContext(Web3Context);

  React.useEffect(() => {
    if (isOpen && account) {
      loadSearchCredits();
    }
  }, [isOpen, account]);

  const loadSearchCredits = async () => {
    if (!account) return;
    try {
      const credits = await paymentService.getUserSearchCredits(account);
      setSearchCredits(credits);
    } catch (error) {
      console.error('Failed to load search credits:', error);
    }
  };

  const handleUserKeySearch = () => {
    if (!userApiKey.trim()) {
      alert('Please enter your OpenAI API key');
      return;
    }
    onSearchWithUserKey(userApiKey);
    onClose();
  };

  const handlePaymentSearch = async () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Check if user has existing credits
      if (searchCredits > 0) {
        const success = await paymentService.deductSearchCredit(account);
        if (success) {
          setSearchCredits(prev => prev - 1);
          onSearchWithPayment();
          onClose();
          return;
        }
      }

      // Create payment intent for new search
      const paymentIntent = await paymentService.createSearchPaymentIntent({
        amount: 1500, // $15.00 in cents
        currency: 'usd',
        description: `AI Patent Search: "${searchQuery.substring(0, 50)}..."`,
        searchQuery,
        userAddress: account
      });

      // Redirect to Stripe Checkout or handle payment
      window.open(`/payment-checkout?client_secret=${paymentIntent.clientSecret}`, '_blank');
      
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI-Powered Patent Search
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Choose Your AI Search Option
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Query: "<span className="font-medium">{searchQuery}</span>"
              </p>
            </div>

            {/* Search Credits Display */}
            {searchCredits > 0 && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    You have {searchCredits} search credit{searchCredits !== 1 ? 's' : ''} remaining
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Option 1: Use Own API Key */}
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedOption === 'user-key'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
                onClick={() => setSelectedOption('user-key')}
              >
                <div className="flex items-start space-x-3">
                  <Key className="w-6 h-6 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Use Your Own API Key
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      Use your own OpenAI API key for unlimited searches. You pay OpenAI directly (~$0.002 per search).
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                      <Shield className="w-4 h-4" />
                      <span>Your key is never stored</span>
                    </div>
                  </div>
                </div>

                {selectedOption === 'user-key' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600"
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={userApiKey}
                      onChange={(e) => setUserApiKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a>
                    </p>
                    <button
                      onClick={handleUserKeySearch}
                      className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      Search with My API Key
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Option 2: Pay for Search */}
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedOption === 'payment'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
                onClick={() => setSelectedOption('payment')}
              >
                <div className="flex items-start space-x-3">
                  <CreditCard className="w-6 h-6 text-purple-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Pay Per Search
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      Pay $15 per AI search. No setup required, just search and pay.
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
                        <DollarSign className="w-4 h-4" />
                        <span>$15.00 per search</span>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                        <Shield className="w-4 h-4" />
                        <span>Secure payment via Stripe</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOption === 'payment' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600"
                  >
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">AI Patent Search</span>
                        <span className="font-semibold text-gray-900 dark:text-white">$15.00</span>
                      </div>
                    </div>
                    <button
                      onClick={handlePaymentSearch}
                      disabled={isProcessingPayment}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      {isProcessingPayment ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : searchCredits > 0 ? (
                        'Use Search Credit'
                      ) : (
                        'Pay $15 & Search'
                      )}
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                Why AI-Powered Search?
              </h5>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Natural language queries: "Find renewable energy patents from 2020-2023"</li>
                <li>• Smart search term optimization for USPTO database</li>
                <li>• Confidence scoring and search explanation</li>
                <li>• Better results than keyword-only search</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AISearchModal;
