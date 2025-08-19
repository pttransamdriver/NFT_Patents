import { ethers, BrowserProvider } from 'ethers';
import { getPatentNFTContract } from '../utils/contracts';
import type { Patent } from '../types';

export interface MintingParams {
  patentNumber: string;
  price: number;
  userAddress: string;
}

export interface MintingResult {
  success: boolean;
  tokenId?: string;
  txHash?: string;
  error?: string;
}

export class MintingService {
  private static instance: MintingService;
  
  public static getInstance(): MintingService {
    if (!MintingService.instance) {
      MintingService.instance = new MintingService();
    }
    return MintingService.instance;
  }

  async mintPatentNFT(params: MintingParams): Promise<MintingResult> {
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        return {
          success: false,
          error: 'MetaMask not found. Please install MetaMask to mint NFTs.'
        };
      }

      // Select the correct provider (same logic as Web3Context)
      let ethereum = window.ethereum;
      if (window.ethereum.providers) {
        ethereum = window.ethereum.providers.find((provider: any) => provider.isMetaMask) || window.ethereum;
      }

      // Get provider and signer
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      // Get contract instance
      const contract = getPatentNFTContract(signer);
      
      // Convert price to wei
      const priceInWei = ethers.parseEther(params.price.toString());
      
      // Call mint function on contract
      const tx = await contract.mintPatentNFT(
        params.userAddress,
        params.patentNumber,
        { value: priceInWei }
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Extract token ID from events
      const tokenId = this.extractTokenIdFromReceipt(receipt);
      
      return {
        success: true,
        tokenId: tokenId?.toString(),
        txHash: receipt.hash
      };
      
    } catch (error: any) {
      console.error('Minting failed:', error);
      
      // Handle specific error cases
      if (error.code === 'ACTION_REJECTED') {
        return {
          success: false,
          error: 'Transaction was rejected by user'
        };
      }
      
      if (error.message?.includes('insufficient funds')) {
        return {
          success: false,
          error: 'Insufficient funds for minting'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Minting failed. Please try again.'
      };
    }
  }

  async checkMintingEligibility(patentNumber: string): Promise<boolean> {
    try {
      if (!window.ethereum) return false;
      
      // Select the correct provider
      let ethereum = window.ethereum;
      if (window.ethereum.providers) {
        ethereum = window.ethereum.providers.find((provider: any) => provider.isMetaMask) || window.ethereum;
      }
      
      const provider = new BrowserProvider(ethereum);
      const contract = getPatentNFTContract(provider);
      
      // Check if patent is already minted
      const exists = await contract.patentExists(patentNumber);
      return !exists;
      
    } catch (error) {
      console.error('Error checking minting eligibility:', error);
      return false;
    }
  }

  async getMintingPrice(): Promise<number> {
    try {
      if (!window.ethereum) return 0.1; // Default price
      
      // Select the correct provider
      let ethereum = window.ethereum;
      if (window.ethereum.providers) {
        ethereum = window.ethereum.providers.find((provider: any) => provider.isMetaMask) || window.ethereum;
      }
      
      const provider = new BrowserProvider(ethereum);
      const contract = getPatentNFTContract(provider);
      
      const priceInWei = await contract.getMintingPrice();
      return parseFloat(ethers.formatEther(priceInWei));
      
    } catch (error) {
      console.error('Error getting minting price:', error);
      return 0.1; // Default fallback price
    }
  }

  private extractTokenIdFromReceipt(receipt: any): bigint | null {
    try {
      // Look for Transfer event which should contain the token ID
      const transferEvent = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('Transfer(address,address,uint256)')
      );
      
      if (transferEvent && transferEvent.topics[3]) {
        return BigInt(transferEvent.topics[3]);
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting token ID:', error);
      return null;
    }
  }
}

export const mintingService = MintingService.getInstance();