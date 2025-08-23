import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { paymentService, checkMetaMaskConnection } from '../services/paymentService';
import { pspTokenService } from '../services/pspTokenService';

const PaymentTest: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const { account, isConnected } = useWeb3();

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testMetaMaskConnection = async () => {
    addResult('Testing MetaMask connection...');
    const result = await checkMetaMaskConnection();
    addResult(`Connection result: ${JSON.stringify(result)}`);
  };

  const testETHPayment = async () => {
    if (!account) {
      addResult('No account connected');
      return;
    }

    addResult('Testing ETH payment...');
    try {
      const result = await paymentService.payWithETH(account);
      addResult(`ETH payment result: ${JSON.stringify(result)}`);
    } catch (error) {
      addResult(`ETH payment error: ${error}`);
    }
  };

  const testPSPPurchase = async () => {
    if (!account) {
      addResult('No account connected');
      return;
    }

    addResult('Testing PSP token purchase...');
    try {
      const result = await pspTokenService.purchaseTokens('0.01', account);
      addResult(`PSP purchase result: ${JSON.stringify(result)}`);
    } catch (error) {
      addResult(`PSP purchase error: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors duration-200"
        title="Payment Test"
      >
        🧪
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment Test
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-sm">
          <span className="font-medium">Connected: </span>
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="text-sm">
          <span className="font-medium">Account: </span>
          <span className="font-mono text-xs">
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'None'}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={testMetaMaskConnection}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
        >
          Test Connection
        </button>
        <button
          onClick={testPSPPurchase}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
        >
          Test PSP Purchase
        </button>
        <button
          onClick={testETHPayment}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
        >
          Test ETH Payment
        </button>
        <button
          onClick={clearResults}
          className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
        >
          Clear Results
        </button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Test Results:
        </h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {testResults.map((result, index) => (
            <div key={index} className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded">
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentTest;