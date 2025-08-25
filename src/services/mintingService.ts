import { ethers, ContractTransactionResponse } from 'ethers';
import { getPatentNFTContract } from '../utils/contracts';
import { patentPdfService } from './patentPdfService';
import { web3Utils } from '../utils/web3Utils';
import { BaseSingleton } from '../utils/baseSingleton';
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

export class MintingService extends BaseSingleton {

  async mintPatentNFT(params: MintingParams): Promise<MintingResult> {
    try {
      // Check if MetaMask is connected
      const { connected, error: connectionError } = await web3Utils.isConnected();
      if (!connected) {
        return {
          success: false,
          error: connectionError || 'Please connect MetaMask to mint NFTs.'
        };
      }

      // Process patent PDF and create IPFS metadata
      let pdfHash = '';
      let imageHash = '';
      let imageUrl = '';
      
      try {
        const pdfData = await patentPdfService.processPatentForNFT(params.patentNumber);
        pdfHash = pdfData.pdfHash;
        imageHash = pdfData.imageHash;
        imageUrl = pdfData.imageUrl;

        // Store IPFS metadata in backend
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/metadata/${params.patentNumber}/ipfs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfHash, imageHash, imageUrl })
        });

      } catch (pdfError) {
        // Continue with minting even if PDF processing fails
        imageUrl = `https://via.placeholder.com/400x600.png?text=Patent+${params.patentNumber}`;
      }

      // Get signer using web3Utils
      const signer = await web3Utils.createSigner();
      if (!signer) {
        return {
          success: false,
          error: 'Unable to get signer from MetaMask'
        };
      }
      
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
      
      // Automatically add NFT to MetaMask
      if (tokenId) {
        await this.addNFTToMetaMask(tokenId.toString(), params.patentNumber);
      }
      
      return {
        success: true,
        tokenId: tokenId?.toString(),
        txHash: receipt.hash
      };
      
    } catch (error: any) {
      const errorMessage = web3Utils.handleTransactionError(error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async checkMintingEligibility(patentNumber: string): Promise<boolean> {
    try {
      const provider = await web3Utils.createProvider();
      if (!provider) return false;
      const contract = getPatentNFTContract(provider);
      
      // Check if patent is already minted
      const exists = await contract.patentExists(patentNumber);
      return !exists;
      
    } catch (error) {
      return false;
    }
  }

  async getMintingPrice(): Promise<number> {
    try {
      const provider = await web3Utils.createProvider();
      if (!provider) return 0.1; // Default price
      const contract = getPatentNFTContract(provider);
      
      const priceInWei = await contract.getMintingPrice();
      return parseFloat(ethers.formatEther(priceInWei));
      
    } catch (error) {
      return 0.1; // Default fallback price
    }
  }

  async addNFTToMetaMask(tokenId: string, patentNumber: string): Promise<void> {
    try {
      if (!window.ethereum) {
        return;
      }

      // Get contract address from environment
      const contractAddress = import.meta.env.VITE_PATENT_NFT_ADDRESS;
      
      if (!contractAddress) {
        return;
      }

      
      // For local networks, MetaMask's wallet_watchAsset might not work for ERC721
      // Let's try and handle the error gracefully
      try {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC721',
            options: {
              address: contractAddress,
              tokenId: tokenId,
              name: `Patent NFT #${tokenId}`,
              description: `Patent ${patentNumber} - Tokenized Patent NFT`,
              image: `https://via.placeholder.com/300x300.png?text=Patent+${tokenId}`, // Placeholder image URL
            },
          },
        });
      } catch (watchError: any) {
        // MetaMask might not support ERC721 on local networks
        
        // Instead, copy contract info to clipboard as fallback
        const contractInfo = `Contract: ${contractAddress}\nToken ID: ${tokenId}\nType: ERC721`;
        navigator.clipboard.writeText(contractInfo);
        
        throw new Error(`NFT info copied to clipboard. MetaMask may not support NFT import on local networks. Contract: ${contractAddress}, Token ID: ${tokenId}`);
      }
    } catch (error: any) {
      throw error; // Let the UI handle the error message
    }
  }

  async addAllUserNFTsToMetaMask(userAddress: string): Promise<void> {
    try {
      if (!window.ethereum) return;

      const provider = await web3Utils.createProvider();
      if (!provider) return;
      const contract = getPatentNFTContract(provider);

      // Get user's NFT balance
      const balance = await contract.balanceOf(userAddress);

      // Add each NFT to MetaMask
      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, BigInt(i));
          
          // Get token URI to extract patent number (if available)
          let patentNumber = 'Unknown';
          try {
            const tokenURI = await contract.tokenURI(tokenId);
            // Extract patent number from URI if possible
            const match = tokenURI.match(/([A-Z]{2}\d+[A-Z]\d*)/);
            if (match) patentNumber = match[1];
          } catch (error) {
          }

          await this.addNFTToMetaMask(tokenId.toString(), patentNumber);
          
          // Add small delay to avoid overwhelming MetaMask
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
        }
      }
    } catch (error) {
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
      return null;
    }
  }
}

export const mintingService = MintingService.getInstance() as MintingService;