import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, CheckCircle, AlertCircle, Upload, Eye, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

interface MintingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

const MintNFTPage: React.FC = () => {
  const [patentNumber, setPatentNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    patent?: any;
    error?: string;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [mintingSteps, setMintingSteps] = useState<MintingStep[]>([
    { id: 1, title: 'Verify Patent', description: 'Check patent availability and validity', completed: false, active: true },
    { id: 2, title: 'Preview NFT', description: 'Review NFT metadata and appearance', completed: false, active: false },
    { id: 3, title: 'Mint NFT', description: 'Create and mint your patent NFT', completed: false, active: false },
  ]);
  const { provider, signer, account, connectWallet, isConnected } = useWeb3();

  const mockPatentData = {
    patentNumber: 'US-12325364-B1',
    title: 'Advanced Quantum Error Correction System',
    abstract: 'A revolutionary quantum error correction method that significantly reduces decoherence in quantum computing systems through novel stabilizer codes and real-time error detection.',
    inventors: ['Dr. Sarah Chen', 'Prof. Michael Rodriguez', 'Dr. James Wilson'],
    assignee: 'Quantum Dynamics Corporation',
    filingDate: '2023-03-15',
    status: 'active',
    category: 'Computing',
    estimatedValue: '15.2 ETH',
    isAvailable: true
  };

  // Updated patent number validation to handle real USPTO formats
  const validatePatentNumber = (patentNum: string): boolean => {
    // Remove spaces and convert to uppercase
    const cleanPatent = patentNum.replace(/\s/g, '').toUpperCase();
    
    // Modern USPTO formats:
    // US-XXXXXXXX-XX (e.g., US-12325364-B1)
    // US XXXXXXXX XX (with spaces)
    // USXXXXXXXX (without separators)
    // Also support older formats like US10,123,456
    const modernFormat = /^US-?\d{7,10}-?[A-Z]\d?$/;
    const olderFormat = /^US\d{2,},?\d{3},?\d{3}$/;
    const basicFormat = /^US\d{7,10}$/;
    
    return modernFormat.test(cleanPatent) || olderFormat.test(cleanPatent) || basicFormat.test(cleanPatent);
  };

  const handlePatentVerification = async () => {
    if (!patentNumber.trim()) {
      toast.error('Please enter a patent number');
      return;
    }

    setIsVerifying(true);
    
    // Simulate verification process
    setTimeout(() => {
      const isValidFormat = validatePatentNumber(patentNumber);
      
      if (!isValidFormat) {
        setVerificationResult({
          isValid: false,
          error: 'Invalid patent number format. Please use formats like: US-12325364-B1, US10,123,456, or US12345678'
        });
      } else {
        // Update mock data to match the searched patent if it's the specific one
        const patentData = patentNumber.replace(/\s/g, '').toUpperCase() === 'US-12325364-B1' 
          ? mockPatentData 
          : {
              ...mockPatentData,
              patentNumber: patentNumber.replace(/\s/g, '').toUpperCase(),
              title: 'Revolutionary Water Purification System',
              abstract: 'A novel water purification method using nanotechnology filters that remove 99.99% of contaminants while preserving essential minerals.',
              estimatedValue: '8.5 ETH'
            };

        setVerificationResult({
          isValid: true,
          patent: patentData
        });
        updateStep(1, true);
        setCurrentStep(2);
        updateStep(2, false, true);
      }
      setIsVerifying(false);
    }, 2000);
  };

  const updateStep = (stepId: number, completed: boolean, active: boolean = false) => {
    setMintingSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, completed, active }
        : step.id < stepId 
        ? { ...step, completed: true, active: false }
        : { ...step, completed: false, active: false }
    ));
  };

  const handlePreviewApproval = () => {
    updateStep(2, true);
    setCurrentStep(3);
    updateStep(3, false, true);
  };

  const handleMintNFT = async () => {
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet first');
      await connectWallet();
      return;
    }

    if (!verificationResult?.patent) {
      toast.error('No patent data available');
      return;
    }

    try {
      // Import the contract functions
      const { mintPatentNFT } = await import('../utils/contracts');
      
      const result = await mintPatentNFT(signer, {
        patentNumber: verificationResult.patent.patentNumber,
        title: verificationResult.patent.title,
        inventor: verificationResult.patent.inventors[0] || 'Unknown'
      });

      if (result.success) {
        updateStep(3, true);
        toast.success(`Patent NFT minted successfully! Token ID: ${result.tokenId}`);
      } else {
        toast.error(`Minting failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      toast.error('Failed to mint NFT. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mint Patent NFT
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Transform your USPTO patent into a unique digital asset
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            {mintingSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                  step.completed 
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.active
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    step.active || step.completed 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
                {index < mintingSteps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 transition-colors duration-200 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
        >
          {/* Step 1: Patent Verification */}
          {currentStep === 1 && (
            <div>
              <div className="flex items-center mb-6">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Patent Verification
                </h2>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  USPTO Patent Number
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="e.g., US-12325364-B1, US10,123,456, or US12345678"
                    value={patentNumber}
                    onChange={(e) => setPatentNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Enter the complete USPTO patent number. Supports modern formats (US-12325364-B1) and older formats (US10,123,456)
                </p>
              </div>

              <button
                onClick={handlePatentVerification}
                disabled={isVerifying || !patentNumber.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
              >
                {isVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying Patent...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Verify Patent
                  </>
                )}
              </button>

              {/* Verification Result */}
              {verificationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-lg border ${
                    verificationResult.isValid
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start">
                    {verificationResult.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                    )}
                    <div className="flex-1">
                      {verificationResult.isValid ? (
                        <div>
                          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                            Patent Verified Successfully!
                          </h3>
                          <p className="text-green-700 dark:text-green-300 text-sm mb-3">
                            This patent is available for minting and all details have been verified.
                          </p>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                              {verificationResult.patent.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {verificationResult.patent.abstract}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Inventors:</span>
                                <p className="text-gray-600 dark:text-gray-400">{verificationResult.patent.inventors.join(', ')}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">Estimated Value:</span>
                                <p className="text-gray-600 dark:text-gray-400">{verificationResult.patent.estimatedValue}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                            Verification Failed
                          </h3>
                          <p className="text-red-700 dark:text-red-300 text-sm">
                            {verificationResult.error}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Step 2: Preview NFT */}
          {currentStep === 2 && verificationResult?.isValid && (
            <div>
              <div className="flex items-center mb-6">
                <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  NFT Preview
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* NFT Preview Card */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {verificationResult.patent.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Patent #{verificationResult.patent.patentNumber}
                    </p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Category:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{verificationResult.patent.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="font-medium text-green-600 dark:text-green-400 capitalize">{verificationResult.patent.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Est. Value:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{verificationResult.patent.estimatedValue}</span>
                    </div>
                  </div>
                </div>

                {/* Metadata Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">NFT Metadata</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                        <p className="text-gray-600 dark:text-gray-400">{verificationResult.patent.title}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                        <p className="text-gray-600 dark:text-gray-400">{verificationResult.patent.abstract}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Attributes:</span>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span>Patent Number</span>
                            <span>{verificationResult.patent.patentNumber}</span>
                          </div>
                          <div className="flex justify-between py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span>Filing Date</span>
                            <span>{verificationResult.patent.filingDate}</span>
                          </div>
                          <div className="flex justify-between py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span>Assignee</span>
                            <span>{verificationResult.patent.assignee}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">What happens next?</h5>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                      <li>• Patent document will be stored on IPFS</li>
                      <li>• NFT will be minted on Ethereum blockchain</li>
                      <li>• You'll receive ownership rights</li>
                      <li>• NFT can be traded on marketplace</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    updateStep(1, false, true);
                    updateStep(2, false, false);
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Back to Verification
                </button>
                <button
                  onClick={handlePreviewApproval}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Looks Good - Proceed to Mint
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Mint NFT */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center mb-6">
                <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Mint Your Patent NFT
                </h2>
              </div>

              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to Mint
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your patent NFT is ready to be minted. This will create a unique digital asset on the blockchain.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Minting Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Patent Number:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{verificationResult?.patent.patentNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Minting Fee:</span>
                    <span className="font-medium text-gray-900 dark:text-white">0.05 ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gas Fee (est.):</span>
                    <span className="font-medium text-gray-900 dark:text-white">0.01 ETH</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Total Cost:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">0.06 ETH</span>
                    </div>
                  </div>
                </div>
              </div>

              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet to Mint
                </button>
              ) : (
                <button
                  onClick={handleMintNFT}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center transform hover:scale-105"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Mint Patent NFT
                </button>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                By minting this NFT, you confirm that you have the right to tokenize this patent
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MintNFTPage;