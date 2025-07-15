import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Key, Brain, Shield, Zap, DollarSign, Sparkles, Lock, Wallet, Coins } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { paymentService } from '../services/paymentService';
import { pspTokenService, PSPTokenInfo } from '../services/pspTokenService';

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
  const [activeTab, setActiveTab] = useState<'integrated' | 'user-key'>('integrated');
  const [userApiKey, setUserApiKey] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [searchCredits, setSearchCredits] = useState(0);
  const [pspTokenInfo, setPspTokenInfo] = useState<PSPTokenInfo | null>(null);
  const [searchPriceInPSP, setSearchPriceInPSP] = useState('500');
  const { account } = useWeb3();

  React.useEffect(() => {
    if (isOpen && account) {
      loadSearchCredits();
      loadPSPTokenInfo();
      loadSearchPrice();
    }
  }, [isOpen, account]);

  const loadPSPTokenInfo = async () => {
    if (!account) return;
    try {
      const tokenInfo = await pspTokenService.getTokenInfo(account);
      setPspTokenInfo(tokenInfo);
    } catch (error) {
      console.error('Failed to load PSP token info:', error);
    }
  };

  const loadSearchPrice = async () => {
    try {
      const price = await pspTokenService.getSearchPrice();
      setSearchPriceInPSP(price);
    } catch (error) {
      console.error('Failed to load search price:', error);
    }
  };

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

    // Check if user has existing credits first
    if (searchCredits > 0) {
      setIsProcessingPayment(true);
      try {
        const success = await paymentService.deductSearchCredit(account);
        if (success) {
          setSearchCredits(prev => prev - 1);
          onSearchWithPayment();
          onClose();
          return;
        }
      } catch (error) {
        console.error('Credit deduction failed:', error);
      } finally {
        setIsProcessingPayment(false);
      }
    }

    // Handle PSP token payment (default payment method)
    await handlePSPPayment();
  };

  const handlePSPPayment = async () => {
    setIsProcessingPayment(true);
    try {
      // Check PSP token balance first
      if (!pspTokenInfo || parseFloat(pspTokenInfo.userBalance) < parseFloat(searchPriceInPSP)) {
        alert(`Insufficient PSP tokens. You need ${searchPriceInPSP} PSP tokens but only have ${pspTokenInfo?.userBalance || '0'} PSP.`);
        setIsProcessingPayment(false);
        return;
      }

      const result = await pspTokenService.payWithPSP(account!);

      if (result.success) {
        // Update credits and token info
        setSearchCredits(result.totalCredits || 1);
        await loadPSPTokenInfo(); // Refresh token balance
        alert(`Payment successful! You now have ${result.totalCredits} search credits.`);
        onSearchWithPayment();
        onClose();
      } else {
        alert(`Payment failed: ${result.error}`);
      }
    } catch (error) {
      console.error('PSP payment failed:', error);
      alert('PSP payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleETHPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const result = await paymentService.payWithETH(account!);

      if (result.success) {
        setSearchCredits(result.totalCredits || 1);
        await loadPSPTokenInfo(); // Refresh balances
        alert(`ETH payment successful! You now have ${result.totalCredits} search credits.`);
        onSearchWithPayment();
        onClose();
      } else {
        alert(`ETH payment failed: ${result.error}`);
      }
    } catch (error) {
      console.error('ETH payment failed:', error);
      alert('ETH payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleUSDCPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const result = await paymentService.payWithUSDC(account!);

      if (result.success) {
        setSearchCredits(result.totalCredits || 1);
        await loadPSPTokenInfo(); // Refresh balances
        alert(`USDC payment successful! You now have ${result.totalCredits} search credits.`);
        onSearchWithPayment();
        onClose();
      } else {
        alert(`USDC payment failed: ${result.error}`);
      }
    } catch (error) {
      console.error('USDC payment failed:', error);
      alert('USDC payment failed. Please try again.');
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
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI-Powered Patent Search
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose your preferred search method
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Query Display */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Your Search Query
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    "{searchQuery}"
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    AI will convert this to optimized patent search terms
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('integrated')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'integrated'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Integrated AI Search</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('user-key')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'user-key'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Key className="w-4 h-4" />
                  <span>Use Your Own AI API Key</span>
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'integrated' && (
                <motion.div
                  key="integrated"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
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

                  {/* Integrated AI Search Content */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Integrated AI Search
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Our premium AI service with the best integration and results
                      </p>
                    </div>

                    {/* PSP Token Balance Display */}
                    {pspTokenInfo && (
                      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Coins className="w-5 h-5 text-blue-600" />
                            <span className="text-blue-800 dark:text-blue-200 font-medium">
                              PSP Token Balance
                            </span>
                          </div>
                          <span className="text-blue-900 dark:text-blue-100 font-bold">
                            {parseFloat(pspTokenInfo.userBalance).toLocaleString()} PSP
                          </span>
                        </div>
                        {parseFloat(pspTokenInfo.userBalance) < parseFloat(searchPriceInPSP) && (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                            ⚠️ Insufficient balance. You need {searchPriceInPSP} PSP tokens for one search.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {searchPriceInPSP} PSP
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          for 1 AI search
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Premium AI • Only $5.00 USD per search
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Patent Search Pennies (PSP) • 1 PSP = $0.01 USD
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span>Advanced AI patent search optimization</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span>Instant results with confidence scoring</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span>No API key setup required</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span>Premium support included</span>
                        </div>
                      </div>

                      {/* Payment Options */}
                      <div className="space-y-3">
                        {searchCredits > 0 ? (
                          <button
                            onClick={handlePaymentSearch}
                            disabled={isProcessingPayment}
                            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            {isProcessingPayment ? (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Using Credit...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-2">
                                <Zap className="w-4 h-4" />
                                <span>Use Search Credit</span>
                              </div>
                            )}
                          </button>
                        ) : (
                          <>
                            {/* PSP Payment */}
                            <button
                              onClick={handlePSPPayment}
                              disabled={isProcessingPayment || !pspTokenInfo || parseFloat(pspTokenInfo.userBalance) < parseFloat(searchPriceInPSP)}
                              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              {isProcessingPayment ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Processing PSP Payment...</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center space-x-2">
                                  <Coins className="w-4 h-4" />
                                  <span>Pay {searchPriceInPSP} PSP</span>
                                </div>
                              )}
                            </button>

                            {/* ETH Payment */}
                            <button
                              onClick={handleETHPayment}
                              disabled={isProcessingPayment}
                              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              {isProcessingPayment ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Processing ETH Payment...</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center space-x-2">
                                  <DollarSign className="w-4 h-4" />
                                  <span>Pay with ETH</span>
                                </div>
                              )}
                            </button>

                            {/* USDC Payment */}
                            <button
                              onClick={handleUSDCPayment}
                              disabled={isProcessingPayment}
                              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              {isProcessingPayment ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Processing USDC Payment...</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center space-x-2">
                                  <DollarSign className="w-4 h-4" />
                                  <span>Pay with USDC</span>
                                </div>
                              )}
                            </button>
                          </>
                        )}
                      </div>

                      {/* Web3 Payment Benefits */}
                      <div className="mt-3 text-center">
                        <div className="text-xs text-green-600 dark:text-green-400">
                          ✓ Fully decentralized • ✓ No middlemen • ✓ Instant settlement
                        </div>
                      </div>

                      {/* Buy PSP Tokens Link */}
                      {pspTokenInfo && parseFloat(pspTokenInfo.userBalance) < parseFloat(searchPriceInPSP) && (
                        <div className="mt-3 text-center">
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Need more PSP tokens? You can purchase them with ETH in your wallet.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'user-key' && (
                <motion.div
                  key="user-key"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* User API Key Content */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Key className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Use Your Own AI API Key
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Use your personal OpenAI API key for unlimited searches
                      </p>
                    </div>

                    {/* Privacy Assurance */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                            Your Privacy is Protected
                          </h4>
                          <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                            <li>• Your API key is never stored on our servers</li>
                            <li>• Used only for this search session</li>
                            <li>• Automatically cleared when you close this window</li>
                            <li>• All communication is encrypted</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Cost Comparison */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        Cost Comparison
                      </h4>
                      <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                        <div className="flex justify-between">
                          <span>Your API key cost:</span>
                          <span className="font-medium">~$0.002 per search</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Our integrated service:</span>
                          <span className="font-medium">$5.00 per search</span>
                        </div>
                        <div className="pt-1 border-t border-blue-200 dark:border-blue-600">
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            Save 99.96% with your own key!
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        OpenAI API Key
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="password"
                          placeholder="sk-..."
                          value={userApiKey}
                          onChange={(e) => setUserApiKey(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <p className="text-gray-500 dark:text-gray-400">
                          Get your API key from{' '}
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            OpenAI Platform
                          </a>
                        </p>
                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <Shield className="w-3 h-3" />
                          <span>Secure</span>
                        </div>
                      </div>
                    </div>

                    {/* Search Button */}
                    <button
                      onClick={handleUserKeySearch}
                      disabled={!userApiKey.trim()}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Brain className="w-4 h-4" />
                      <span>Search with My API Key</span>
                    </button>

                    {/* Benefits */}
                    <div className="text-center">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Perfect for Power Users
                      </h5>
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>Unlimited searches</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>Lowest cost per search</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>Full control</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>No monthly limits</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Section */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                <Brain className="w-4 h-4" />
                <span>Why AI-Powered Search?</span>
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
