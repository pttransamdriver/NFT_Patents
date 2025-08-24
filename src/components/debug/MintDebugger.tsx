import React, { useState } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { mintingService } from '../../services/mintingService';
import { getPatentNFTContract } from '../../utils/contracts';

const MintDebugger: React.FC = () => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<string[]>([]);
  const { isConnected, account, provider, signer } = useWeb3();

  const addLog = (message: string) => {
    console.log(message);
    setDebugResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const debugMinting = async () => {
    if (!isConnected || !account || !provider || !signer) {
      addLog('❌ Wallet not connected properly');
      return;
    }

    setIsDebugging(true);
    setDebugResults([]);
    
    try {
      addLog('🔍 Starting debug process...');
      addLog(`👤 Connected account: ${account}`);
      
      // Check contract
      const contract = getPatentNFTContract(provider);
      addLog(`📄 Contract address: ${contract.target}`);
      
      // Check total supply
      const totalSupply = await contract.totalSupply();
      addLog(`📊 Total NFTs minted: ${totalSupply.toString()}`);
      
      // Check user balance
      const userBalance = await contract.balanceOf(account);
      addLog(`🎨 Your NFT balance: ${userBalance.toString()}`);
      
      // Check minting price
      const mintingPrice = await contract.getMintingPrice();
      addLog(`💰 Minting price: ${mintingPrice.toString()} wei (${(Number(mintingPrice) / 1e18).toFixed(4)} ETH)`);
      
      // Check user ETH balance
      const ethBalance = await provider.getBalance(account);
      addLog(`💎 Your ETH balance: ${(Number(ethBalance) / 1e18).toFixed(4)} ETH`);
      
      // Test patent existence check
      const testPatentNumber = `TEST-${Date.now()}`;
      const patentExists = await contract.patentExists(testPatentNumber);
      addLog(`❓ Test patent exists: ${patentExists}`);
      
      // Attempt to mint
      addLog('🚀 Attempting to mint NFT...');
      const result = await mintingService.mintPatentNFT({
        patentNumber: testPatentNumber,
        price: 0.1,
        userAddress: account
      });
      
      if (result.success) {
        addLog(`✅ Minting successful! Token ID: ${result.tokenId}`);
        addLog(`📄 Transaction hash: ${result.txHash}`);
        
        // Check new balances
        const newTotalSupply = await contract.totalSupply();
        const newUserBalance = await contract.balanceOf(account);
        addLog(`📊 New total supply: ${newTotalSupply.toString()}`);
        addLog(`🎨 New user balance: ${newUserBalance.toString()}`);
        
        // Try to get NFT details
        if (newUserBalance > 0) {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(account, 0n);
            addLog(`🔍 Your first NFT: Token ID ${tokenId.toString()}`);
            
            // Try to get patent details
            try {
              const patentDetails = await contract.getPatent(tokenId);
              addLog(`📝 Patent title: ${patentDetails.title}`);
              addLog(`📝 Patent number: ${patentDetails.patentNumber}`);
              addLog(`📝 Inventor: ${patentDetails.inventor}`);
            } catch (e) {
              addLog(`⚠️ Could not get patent details: ${e.message}`);
            }
            
            // Try to get token URI
            try {
              const tokenURI = await contract.tokenURI(tokenId);
              addLog(`🔗 Token URI: ${tokenURI}`);
            } catch (e) {
              addLog(`⚠️ Could not get token URI: ${e.message}`);
            }
          } catch (e) {
            addLog(`⚠️ Could not get NFT details: ${e.message}`);
          }
        }
        
      } else {
        addLog(`❌ Minting failed: ${result.error}`);
      }
      
    } catch (error: any) {
      addLog(`💥 Debug error: ${error.message}`);
      console.error('Debug error:', error);
    } finally {
      setIsDebugging(false);
    }
  };

  const clearLogs = () => {
    setDebugResults([]);
  };

  if (!isConnected) {
    return null; // Don't show if not connected
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-hidden z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          🔧 Mint Debugger
        </h3>
        <div className="space-x-2">
          <button
            onClick={clearLogs}
            className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear
          </button>
          <button
            onClick={debugMinting}
            disabled={isDebugging}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isDebugging ? 'Testing...' : 'Test Mint'}
          </button>
        </div>
      </div>
      
      <div className="bg-black text-green-400 text-xs p-2 rounded font-mono h-64 overflow-y-auto">
        {debugResults.length === 0 ? (
          <div className="text-gray-500">Click "Test Mint" to debug minting process</div>
        ) : (
          debugResults.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MintDebugger;