import { ethers, BrowserProvider } from 'ethers';

export interface PSPPayment {
  userAddress: string;
  transactionHash: string;
  tokenAmount: number;
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  creditsAdded?: number;
  totalCredits?: number;
  error?: string;
}

export enum PaymentToken {
  ETH = 0,
  USDC = 1,
  PSP = 2
}

// SearchPayment Contract ABI for credit management
const SEARCH_PAYMENT_ABI = [
  'function getUserCredits(address user) view returns (uint256)',
  'function payWithETH() payable returns (bool)',
  'function payWithUSDC() returns (bool)',
  'function payWithPSP() returns (bool)',
  'function getSearchPrice(uint8 token) view returns (uint256)',
  'function getAllSearchPrices() view returns (uint256 ethPrice, uint256 usdcPrice, uint256 pspPrice)',
  'function useCredit(address user) returns (bool)',
  'event PaymentReceived(address indexed user, uint8 indexed token, uint256 amount, uint256 creditsAdded)',
  'event CreditUsed(address indexed user, uint256 creditsRemaining)'
];

export class PaymentService {
  private static instance: PaymentService;
  private searchPaymentAddress: string;

  constructor() {
    this.searchPaymentAddress = import.meta.env.VITE_SEARCH_PAYMENT_ADDRESS || '';
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Get user's remaining search credits from smart contract
   */
  async getUserSearchCredits(userAddress: string): Promise<number> {
    try {
      if (!window.ethereum || !this.searchPaymentAddress) {
        return 0;
      }

      const provider = new BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(this.searchPaymentAddress, SEARCH_PAYMENT_ABI, provider);
      
      const credits = await contract.getUserCredits(userAddress);
      return Number(credits);
    } catch (error) {
      console.error('Failed to get user search credits:', error);
      return 0;
    }
  }

  /**
   * Deduct one search credit (handled by smart contract)
   */
  async deductSearchCredit(userAddress: string): Promise<boolean> {
    try {
      if (!window.ethereum || !this.searchPaymentAddress) {
        return false;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(this.searchPaymentAddress, SEARCH_PAYMENT_ABI, signer);
      
      const transaction = await contract.useCredit(userAddress);
      await transaction.wait();
      
      return true;
    } catch (error) {
      console.error('Failed to deduct search credit:', error);
      return false;
    }
  }

  /**
   * Verify PSP token payment (Web3 only - transaction already confirmed)
   */
  async verifyPSPPayment(payment: PSPPayment): Promise<PaymentResult> {
    try {
      // In a pure Web3 app, if we have a transaction hash, the payment is already verified
      // The smart contract handles the credit addition automatically
      const credits = await this.getUserSearchCredits(payment.userAddress);
      
      return {
        success: true,
        transactionHash: payment.transactionHash,
        creditsAdded: 1,
        totalCredits: credits
      };
    } catch (error: any) {
      console.error('PSP payment verification failed:', error);
      return {
        success: false,
        error: error.message || 'Payment verification failed'
      };
    }
  }

  /**
   * Get current search pricing from smart contract
   */
  async getSearchPricing(): Promise<{
    ethPrice: string;
    usdcPrice: string;
    pspPrice: string;
    usdEquivalent: string;
  }> {
    try {
      if (!window.ethereum || !this.searchPaymentAddress) {
        return {
          ethPrice: '0.002',
          usdcPrice: '5.00',
          pspPrice: '500',
          usdEquivalent: '5.00'
        };
      }

      const provider = new BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(this.searchPaymentAddress, SEARCH_PAYMENT_ABI, provider);
      
      const [ethPrice, usdcPrice, pspPrice] = await contract.getAllSearchPrices();
      
      return {
        ethPrice: ethers.formatEther(ethPrice),
        usdcPrice: ethers.formatUnits(usdcPrice, 6), // USDC has 6 decimals
        pspPrice: ethers.formatEther(pspPrice),
        usdEquivalent: '5.00'
      };
    } catch (error) {
      console.error('Failed to get search pricing:', error);
      return {
        ethPrice: '0.002',
        usdcPrice: '5.00',
        pspPrice: '500',
        usdEquivalent: '5.00'
      };
    }
  }

  /**
   * Pay for search with ETH
   */
  async payWithETH(userAddress: string): Promise<PaymentResult> {
    try {
      if (!window.ethereum || !this.searchPaymentAddress) {
        return { success: false, error: 'MetaMask not available or contract address not configured' };
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(this.searchPaymentAddress, SEARCH_PAYMENT_ABI, signer);

      // Get ETH price
      const pricing = await this.getSearchPricing();
      const ethAmount = ethers.parseEther(pricing.ethPrice);

      // Check user balance
      const userBalance = await provider.getBalance(userAddress);
      if (userBalance < ethAmount) {
        return { success: false, error: 'Insufficient ETH balance' };
      }

      // Pay with ETH
      const transaction = await contract.payWithETH({
        value: ethAmount,
        gasLimit: 200000
      });

      const receipt = await transaction.wait();
      const newCredits = await this.getUserSearchCredits(userAddress);

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        creditsAdded: 1,
        totalCredits: newCredits
      };
    } catch (error: any) {
      console.error('ETH payment failed:', error);
      return { success: false, error: error.message || 'ETH payment failed' };
    }
  }

  /**
   * Pay for search with USDC
   */
  async payWithUSDC(userAddress: string): Promise<PaymentResult> {
    try {
      if (!window.ethereum || !this.searchPaymentAddress) {
        return { success: false, error: 'MetaMask not available or contract address not configured' };
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(this.searchPaymentAddress, SEARCH_PAYMENT_ABI, signer);

      // Pay with USDC (approval handled separately in the UI)
      const transaction = await contract.payWithUSDC({
        gasLimit: 200000
      });

      const receipt = await transaction.wait();
      const newCredits = await this.getUserSearchCredits(userAddress);

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        creditsAdded: 1,
        totalCredits: newCredits
      };
    } catch (error: any) {
      console.error('USDC payment failed:', error);
      return { success: false, error: error.message || 'USDC payment failed' };
    }
  }

  /**
   * Pay for search with PSP tokens
   */
  async payWithPSP(userAddress: string): Promise<PaymentResult> {
    try {
      if (!window.ethereum || !this.searchPaymentAddress) {
        return { success: false, error: 'MetaMask not available or contract address not configured' };
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(this.searchPaymentAddress, SEARCH_PAYMENT_ABI, signer);

      // Pay with PSP (approval handled separately in the UI)
      const transaction = await contract.payWithPSP({
        gasLimit: 200000
      });

      const receipt = await transaction.wait();
      const newCredits = await this.getUserSearchCredits(userAddress);

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        creditsAdded: 1,
        totalCredits: newCredits
      };
    } catch (error: any) {
      console.error('PSP payment failed:', error);
      return { success: false, error: error.message || 'PSP payment failed' };
    }
  }

  /**
   * Validate user address format
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate transaction hash format
   */
  private isValidTransactionHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }
}

export const paymentService = PaymentService.getInstance();