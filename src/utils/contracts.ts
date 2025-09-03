import { ethers, BrowserProvider, JsonRpcSigner, JsonRpcProvider, Contract } from 'ethers';
import toast from 'react-hot-toast';
import { PATENT_NFT_ABI } from './contractABIs';


// Contract addresses from environment variables
const getContractAddresses = () => {
  return {
    PatentNFT: import.meta.env.VITE_PATENT_NFT_ADDRESS,
    PSPToken: import.meta.env.VITE_PSP_TOKEN_ADDRESS,
    SearchPayment: import.meta.env.VITE_SEARCH_PAYMENT_ADDRESS,
    Marketplace: import.meta.env.VITE_MARKETPLACE_ADDRESS
  };
};

export const getPatentNFTContract = (
  providerOrSigner: BrowserProvider | JsonRpcSigner | JsonRpcProvider
): Contract => {
  const addresses = getContractAddresses();

  // Use centralized ABI definition

  return new Contract(
    addresses.PatentNFT,
    PATENT_NFT_ABI,
    providerOrSigner
  );
};

export const mintPatentNFT = async (
  signer: JsonRpcSigner,
  patentData: {
    patentNumber: string;
    title: string;
    inventor: string;
  }
): Promise<{ success: boolean; tokenId?: string; transactionHash?: string; error?: string }> => {
  try {
    const contract = getPatentNFTContract(signer);
    const userAddress = await signer.getAddress();

    // Check if patent already exists
    const exists = await contract.patentExists(patentData.patentNumber);
    if (exists) {
      return { success: false, error: 'Patent NFT already exists for this patent number' };
    }

    // Get minting price
    const mintingPrice = await contract.getMintingPrice();
    
    // Add some extra gas for safety
    const gasEstimate = await contract.mintPatentNFT.estimateGas(
      userAddress,
      patentData.patentNumber,
      { value: mintingPrice }
    );

    // Call the mint function (contract only takes recipient and patentNumber)
    const tx = await contract.mintPatentNFT(
      userAddress,
      patentData.patentNumber,
      { 
        value: mintingPrice,
        gasLimit: gasEstimate + BigInt(50000) // Add 50k gas buffer
      }
    );

    toast.loading('Transaction submitted! Waiting for confirmation...', { id: 'minting' });

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      // Find the PatentMinted event to get the token ID
      const mintEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog?.name === 'PatentMinted';
        } catch {
          return false;
        }
      });

      let tokenId = 'Unknown';
      if (mintEvent) {
        const parsedLog = contract.interface.parseLog(mintEvent);
        tokenId = parsedLog?.args[0]?.toString() || 'Unknown';
      }

      toast.success('Patent NFT minted successfully!', { id: 'minting' });
      return { 
        success: true, 
        tokenId,
        transactionHash: receipt.hash 
      };
    } else {
      toast.error('Transaction failed', { id: 'minting' });
      return { success: false, error: 'Transaction failed' };
    }

  } catch (error: any) {
    toast.error('Failed to mint NFT', { id: 'minting' });
    
    let errorMessage = 'Unknown error occurred';
    if (error.reason) {
      errorMessage = error.reason;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

export const getMintingPrice = async (provider: BrowserProvider): Promise<string> => {
  try {
    const contract = getPatentNFTContract(provider);
    const price = await contract.getMintingPrice();
    return ethers.formatEther(price);
  } catch (error) {
    return '0.05'; // fallback price
  }
};

export const checkPatentExists = async (provider: BrowserProvider | JsonRpcProvider, patentNumber: string): Promise<boolean> => {
  try {
    const contract = getPatentNFTContract(provider);
    return await contract.patentExists(patentNumber);
  } catch (error) {
    console.warn(`Failed to check patent existence for ${patentNumber}:`, error);
    return false;
  }
};

// Create a read-only provider for contract state queries
export const createReadOnlyProvider = (): JsonRpcProvider | null => {
  try {
    const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';
    return new JsonRpcProvider(rpcUrl);
  } catch (error) {
    console.warn('Failed to create read-only provider:', error);
    return null;
  }
};

export const getUserNFTs = async (signer: any, userAddress: string): Promise<any[]> => {
  try {
    const contract = getPatentNFTContract(signer);
    const balance = await contract.balanceOf(userAddress);
    const nfts = [];

    for (let i = 0; i < balance; i++) {
      try {
        const tokenId = await contract.tokenOfOwnerByIndex(userAddress, BigInt(i));
        const tokenURI = await contract.tokenURI(tokenId);
        
        nfts.push({
          tokenId: tokenId.toString(),
          tokenURI,
        });
      } catch (error) {
      }
    }

    return nfts;
  } catch (error) {
    return [];
  }
};

export { getContractAddresses as CONTRACT_ADDRESSES };
