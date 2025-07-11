import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';
import { paymentService, PSPPayment, PaymentResult } from './paymentService';

// PSP Token Contract ABI (minimal interface)
const PSP_TOKEN_ABI = [
  // Read functions
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function getTokenPrice() view returns (uint256)',
  'function calculateTokensForETH(uint256 ethAmount) view returns (uint256)',
  'function calculateETHForTokens(uint256 tokenAmount) view returns (uint256)',
  
  // Write functions
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function purchaseTokens() payable returns (bool)',
  'function redeemTokens(uint256 tokenAmount) returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethPaid)'
];

// SearchPayment Contract ABI (minimal interface)
const SEARCH_PAYMENT_ABI = [
  'function payForSearch() returns (bool)',
  'function getSearchPrice() view returns (uint256)',
  'function getPSPTokenAddress() view returns (address)',
  'function getUserStats(address user) view returns (uint256 totalPaid, uint256 searchesPurchased)'
];

export interface PSPTokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  userBalance: string;
  tokenPriceInWei: string;
  contractAddress: string;
}

export interface PurchaseResult {
  success: boolean;
  transactionHash?: string;
  tokensPurchased?: string;
  error?: string;
}

export class PSPTokenService {
  private static instance: PSPTokenService;
  private pspTokenAddress: string;
  private searchPaymentAddress: string;

  constructor() {
    this.pspTokenAddress = import.meta.env.VITE_PSP_TOKEN_ADDRESS || '';
    this.searchPaymentAddress = import.meta.env.VITE_SEARCH_PAYMENT_ADDRESS || '';
  }

  public static getInstance(): PSPTokenService {
    if (!PSPTokenService.instance) {
      PSPTokenService.instance = new PSPTokenService();
    }
    return PSPTokenService.instance;
  }

  /**
   * Get PSP token information for a user
   */
  async getTokenInfo(userAddress: string): Promise<PSPTokenInfo | null> {
    try {
      if (!window.ethereum || !this.pspTokenAddress) {
        throw new Error('MetaMask not available or PSP token address not configured');
      }

      const provider = new BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(this.pspTokenAddress, PSP_TOKEN_ABI, provider);

      const [name, symbol, decimals, totalSupply, userBalance, tokenPrice] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.balanceOf(userAddress),
        contract.getTokenPrice()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        userBalance: ethers.formatUnits(userBalance, decimals),
        tokenPriceInWei: tokenPrice.toString(),
        contractAddress: this.pspTokenAddress
      };
    } catch (error) {
      console.error('Failed to get PSP token info:', error);
      return null;
    }
  }

  /**
   * Purchase PSP tokens with ETH
   */
  async purchaseTokens(ethAmount: string, userAddress: string): Promise<PurchaseResult> {
    try {
      if (!window.ethereum || !this.pspTokenAddress) {
        return { success: false, error: 'MetaMask not available or PSP token address not configured' };
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(this.pspTokenAddress, PSP_TOKEN_ABI, signer);

      // Calculate how many tokens will be purchased
      const ethAmountWei = ethers.parseEther(ethAmount);
      const tokenAmount = await contract.calculateTokensForETH(ethAmountWei);

      // Purchase tokens
      const transaction = await contract.purchaseTokens({
        value: ethAmountWei,
        gasLimit: 150000
      });

      const receipt = await transaction.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        tokensPurchased: ethers.formatEther(tokenAmount)
      };
    } catch (error: any) {
      console.error('PSP token purchase failed:', error);
      
      if (error.code === 4001) {
        return { success: false, error: 'Transaction rejected by user' };
      } else if (error.code === -32603) {
        return { success: false, error: 'Insufficient funds for gas' };
      } else {
        return { success: false, error: error.message || 'Transaction failed' };
      }
    }
  }

  /**
   * Pay for search using PSP tokens
   */
  async payForSearch(userAddress: string): Promise<PaymentResult> {
    try {
      if (!window.ethereum || !this.pspTokenAddress || !this.searchPaymentAddress) {
        return { success: false, error: 'MetaMask not available or contract addresses not configured' };
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const pspContract = new ethers.Contract(this.pspTokenAddress, PSP_TOKEN_ABI, signer);
      const searchContract = new ethers.Contract(this.searchPaymentAddress, SEARCH_PAYMENT_ABI, signer);

      // Get search price (500 PSP tokens)
      const searchPrice = await searchContract.getSearchPrice();
      
      // Check user balance
      const userBalance = await pspContract.balanceOf(userAddress);
      if (userBalance < searchPrice) {
        return { success: false, error: 'Insufficient PSP token balance' };
      }

      // Check allowance
      const allowance = await pspContract.allowance(userAddress, this.searchPaymentAddress);
      
      // Approve tokens if needed
      if (allowance < searchPrice) {
        const approveTransaction = await pspContract.approve(this.searchPaymentAddress, searchPrice);
        await approveTransaction.wait();
      }

      // Pay for search
      const paymentTransaction = await searchContract.payForSearch({
        gasLimit: 200000
      });

      const receipt = await paymentTransaction.wait();

      // Verify payment with backend
      const verificationResult = await paymentService.verifyPSPPayment({
        userAddress,
        transactionHash: receipt.transactionHash,
        tokenAmount: Number(ethers.formatEther(searchPrice))
      });

      return verificationResult;
    } catch (error: any) {
      console.error('PSP payment failed:', error);
      
      if (error.code === 4001) {
        return { success: false, error: 'Transaction rejected by user' };
      } else if (error.code === -32603) {
        return { success: false, error: 'Insufficient funds for gas' };
      } else {
        return { success: false, error: error.message || 'Payment failed' };
      }
    }
  }

  /**
   * Get user's PSP token balance
   */
  async getUserBalance(userAddress: string): Promise<string> {
    try {
      if (!window.ethereum || !this.pspTokenAddress) {
        return '0';
      }

      const provider = new BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(this.pspTokenAddress, PSP_TOKEN_ABI, provider);
      
      const balance = await contract.balanceOf(userAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get PSP balance:', error);
      return '0';
    }
  }

  /**
   * Calculate ETH needed for specific number of PSP tokens
   */
  async calculateETHForTokens(tokenAmount: string): Promise<string> {
    try {
      if (!window.ethereum || !this.pspTokenAddress) {
        return '0';
      }

      const provider = new BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(this.pspTokenAddress, PSP_TOKEN_ABI, provider);
      
      const tokenAmountWei = ethers.parseEther(tokenAmount);
      const ethAmount = await contract.calculateETHForTokens(tokenAmountWei);
      
      return ethers.formatEther(ethAmount);
    } catch (error) {
      console.error('Failed to calculate ETH for tokens:', error);
      return '0';
    }
  }

  /**
   * Calculate PSP tokens for specific ETH amount
   */
  async calculateTokensForETH(ethAmount: string): Promise<string> {
    try {
      if (!window.ethereum || !this.pspTokenAddress) {
        return '0';
      }

      const provider = new BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(this.pspTokenAddress, PSP_TOKEN_ABI, provider);
      
      const ethAmountWei = ethers.parseEther(ethAmount);
      const tokenAmount = await contract.calculateTokensForETH(ethAmountWei);
      
      return ethers.formatEther(tokenAmount);
    } catch (error) {
      console.error('Failed to calculate tokens for ETH:', error);
      return '0';
    }
  }

  /**
   * Get search price in PSP tokens
   */
  async getSearchPrice(): Promise<string> {
    try {
      if (!window.ethereum || !this.searchPaymentAddress) {
        return '500'; // Default 500 PSP
      }

      const provider = new BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(this.searchPaymentAddress, SEARCH_PAYMENT_ABI, provider);
      
      const price = await contract.getSearchPrice();
      return ethers.formatEther(price);
    } catch (error) {
      console.error('Failed to get search price:', error);
      return '500'; // Default fallback
    }
  }
}

export const pspTokenService = PSPTokenService.getInstance();
