import { ethers } from 'ethers';

// Contract ABI for a simple payment contract
const PAYMENT_CONTRACT_ABI = [
  "function payForSearch() external payable",
  "function getSearchPrice() external view returns (uint256)",
  "function owner() external view returns (address)",
  "event SearchPayment(address indexed user, uint256 amount, uint256 timestamp)"
];

// Contract addresses (deploy these contracts)
const PAYMENT_CONTRACT_ADDRESS = import.meta.env.VITE_PAYMENT_CONTRACT_ADDRESS;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface CryptoPaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class CryptoPaymentService {
  private static instance: CryptoPaymentService;
  
  public static getInstance(): CryptoPaymentService {
    if (!CryptoPaymentService.instance) {
      CryptoPaymentService.instance = new CryptoPaymentService();
    }
    return CryptoPaymentService.instance;
  }

  // Get current ETH price for $15 USD
  async getETHPriceForUSD(usdAmount: number = 15): Promise<string> {
    try {
      // Get ETH price from CoinGecko API
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      const ethPrice = data.ethereum.usd;
      
      // Calculate ETH amount for $15 USD
      const ethAmount = usdAmount / ethPrice;
      return ethers.parseEther(ethAmount.toFixed(6)).toString();
    } catch (error) {
      console.error('Failed to get ETH price:', error);
      // Fallback: assume ETH = $2000 (adjust as needed)
      const fallbackEthAmount = usdAmount / 2000;
      return ethers.parseEther(fallbackEthAmount.toFixed(6)).toString();
    }
  }

  // Get current ETH price in USD for display
  async getCurrentETHPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.error('Failed to get ETH price:', error);
      return 2000; // Fallback price
    }
  }

  // Pay with MetaMask (direct transfer)
  async payWithMetaMask(userAddress: string): Promise<CryptoPaymentResult> {
    try {
      if (!window.ethereum) {
        return { success: false, error: 'MetaMask not installed' };
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = provider.getSigner();

      // Get the ETH amount for $15 USD
      const ethAmount = await this.getETHPriceForUSD(15);
      
      // Your wallet address to receive payments
      const recipientAddress = import.meta.env.VITE_PAYMENT_RECIPIENT_ADDRESS;
      
      if (!recipientAddress) {
        return { success: false, error: 'Payment recipient address not configured' };
      }

      // Send transaction
      const transaction = await signer.sendTransaction({
        to: recipientAddress,
        value: ethAmount,
        gasLimit: 21000 // Standard ETH transfer gas limit
      });

      // Wait for confirmation
      const receipt = await transaction.wait();

      // Notify backend about the payment
      await this.notifyBackendOfPayment({
        userAddress,
        transactionHash: receipt.transactionHash,
        amount: ethAmount,
        currency: 'ETH'
      });

      return {
        success: true,
        transactionHash: receipt.transactionHash
      };

    } catch (error: any) {
      console.error('MetaMask payment failed:', error);
      
      if (error.code === 4001) {
        return { success: false, error: 'Transaction rejected by user' };
      } else if (error.code === -32603) {
        return { success: false, error: 'Insufficient funds for gas' };
      } else {
        return { success: false, error: error.message || 'Transaction failed' };
      }
    }
  }

  // Pay using smart contract (more advanced)
  async payWithContract(userAddress: string): Promise<CryptoPaymentResult> {
    try {
      if (!window.ethereum) {
        return { success: false, error: 'MetaMask not installed' };
      }

      if (!PAYMENT_CONTRACT_ADDRESS) {
        return { success: false, error: 'Payment contract not deployed' };
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = provider.getSigner();

      // Connect to the payment contract
      const contract = new ethers.Contract(PAYMENT_CONTRACT_ADDRESS, PAYMENT_CONTRACT_ABI, signer);

      // Get the required payment amount from contract
      const searchPrice = await contract.getSearchPrice();

      // Execute payment
      const transaction = await contract.payForSearch({
        value: searchPrice,
        gasLimit: 100000 // Adjust based on contract complexity
      });

      const receipt = await transaction.wait();

      // Notify backend
      await this.notifyBackendOfPayment({
        userAddress,
        transactionHash: receipt.transactionHash,
        amount: searchPrice.toString(),
        currency: 'ETH',
        contractAddress: PAYMENT_CONTRACT_ADDRESS
      });

      return {
        success: true,
        transactionHash: receipt.transactionHash
      };

    } catch (error: any) {
      console.error('Contract payment failed:', error);
      return { success: false, error: error.message || 'Contract payment failed' };
    }
  }

  // Notify backend about crypto payment
  private async notifyBackendOfPayment(paymentData: {
    userAddress: string;
    transactionHash: string;
    amount: string;
    currency: string;
    contractAddress?: string;
  }): Promise<void> {
    try {
      await fetch(`${BACKEND_URL}/api/payments/crypto-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
    } catch (error) {
      console.error('Failed to notify backend of crypto payment:', error);
    }
  }

  // Verify transaction on blockchain
  async verifyTransaction(transactionHash: string): Promise<boolean> {
    try {
      if (!window.ethereum) return false;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const receipt = await provider.getTransactionReceipt(transactionHash);
      
      return receipt && receipt.status === 1;
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return false;
    }
  }

  // Get transaction details for display
  async getTransactionDetails(transactionHash: string): Promise<{
    amount: string;
    from: string;
    to: string;
    gasUsed: string;
    status: string;
  } | null> {
    try {
      if (!window.ethereum) return null;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const [transaction, receipt] = await Promise.all([
        provider.getTransaction(transactionHash),
        provider.getTransactionReceipt(transactionHash)
      ]);

      if (!transaction || !receipt) return null;

      return {
        amount: ethers.formatEther(transaction.value),
        from: transaction.from,
        to: transaction.to || '',
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'Success' : 'Failed'
      };
    } catch (error) {
      console.error('Failed to get transaction details:', error);
      return null;
    }
  }

  // Format ETH amount for display
  formatETHAmount(weiAmount: string): string {
    try {
      return parseFloat(ethers.formatEther(weiAmount)).toFixed(6);
    } catch (error) {
      return '0.000000';
    }
  }

  // Check if user has sufficient balance
  async checkBalance(userAddress: string, requiredAmount: string): Promise<boolean> {
    try {
      if (!window.ethereum) return false;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(userAddress);
      
      return balance >= BigInt(requiredAmount);
    } catch (error) {
      console.error('Balance check failed:', error);
      return false;
    }
  }
}

export const cryptoPaymentService = CryptoPaymentService.getInstance();
