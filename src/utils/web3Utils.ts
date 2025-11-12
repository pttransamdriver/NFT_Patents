import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';

/**
 * Centralized Web3 utility functions to eliminate duplication across services
 */
export class Web3Utils {
  private static instance: Web3Utils;
  
  public static getInstance(): Web3Utils {
    if (!Web3Utils.instance) {
      Web3Utils.instance = new Web3Utils();
    }
    return Web3Utils.instance;
  }

  /**
   * Get the correct MetaMask provider (handles multiple providers)
   */
  getMetaMaskProvider(): any {
    if (!window.ethereum) return null;
    
    if (window.ethereum.providers) {
      return window.ethereum.providers.find((provider: any) => provider.isMetaMask) || window.ethereum;
    }
    
    return window.ethereum;
  }

  /**
   * Create a BrowserProvider instance
   */
  async createProvider(): Promise<BrowserProvider | null> {
    const ethereum = this.getMetaMaskProvider();
    if (!ethereum) return null;
    
    return new BrowserProvider(ethereum);
  }

  /**
   * Create a signer instance
   */
  async createSigner(): Promise<JsonRpcSigner | null> {
    const provider = await this.createProvider();
    if (!provider) return null;
    
    return await provider.getSigner();
  }

  /**
   * Check if MetaMask is connected
   */
  async isConnected(): Promise<{ connected: boolean; account?: string; error?: string }> {
    try {
      if (!window.ethereum) {
        return { connected: false, error: 'MetaMask not detected' };
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        return { connected: false, error: 'MetaMask not connected' };
      }

      return { connected: true, account: accounts[0] };
    } catch (error: any) {
      return { connected: false, error: error.message || 'Connection check failed' };
    }
  }

  /**
   * Request MetaMask connection
   */
  async requestConnection(): Promise<{ connected: boolean; account?: string; error?: string }> {
    try {
      if (!window.ethereum) {
        return { connected: false, error: 'MetaMask not detected' };
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        return { connected: false, error: 'Connection rejected' };
      }

      return { connected: true, account: accounts[0] };
    } catch (error: any) {
      if (error.code === 4001) {
        return { connected: false, error: 'Connection rejected by user' };
      } else if (error.code === -32002) {
        return { connected: false, error: 'Connection request pending' };
      } else {
        return { connected: false, error: error.message || 'Connection failed' };
      }
    }
  }

  /**
   * Switch MetaMask to the correct network
   */
  async switchToCorrectNetwork(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!window.ethereum) {
        return { success: false, error: 'MetaMask not detected' };
      }

      const targetChainId = import.meta.env.VITE_CHAIN_ID;

      // Validate chain ID
      if (!targetChainId) {
        return { success: false, error: 'VITE_CHAIN_ID not configured in environment' };
      }

      const chainIdNumber = parseInt(targetChainId);
      if (isNaN(chainIdNumber)) {
        return { success: false, error: `Invalid VITE_CHAIN_ID: ${targetChainId}` };
      }

      const chainIdHex = '0x' + chainIdNumber.toString(16);
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      
      return { success: true };
    } catch (error: any) {
      if (error.code === 4902) {
        return { success: false, error: 'Network not found in wallet. Please add the network manually.' };
      } else {
        return { success: false, error: error.message };
      }
    }
  }

  /**
   * Handle common transaction errors
   */
  handleTransactionError(error: any): string {
    if (error.code === 4001) {
      return 'Transaction rejected by user';
    } else if (error.code === -32002) {
      return 'Transaction request already pending';
    } else if (error.code === -32603) {
      return 'Insufficient funds for gas';
    } else if (error.message?.includes('user rejected')) {
      return 'Transaction cancelled by user';
    } else if (error.message?.includes('insufficient funds')) {
      return 'Insufficient funds';
    } else {
      return error.message || 'Transaction failed';
    }
  }
}

export const web3Utils = Web3Utils.getInstance();