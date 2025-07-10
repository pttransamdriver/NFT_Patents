import { ethers, BrowserProvider, JsonRpcSigner, Contract } from 'ethers';

// Import contract ABIs
import PatentNFTAbi from '../../artifacts/contracts/PatentNFT.sol/PatentNFT.json';
import contractAddresses from '../contracts/contract-address.json';

// Contract addresses from deployment
const CONTRACT_ADDRESSES = contractAddresses;

export const getPatentNFTContract = (
  providerOrSigner: BrowserProvider | JsonRpcSigner
) => {
  return new Contract(
    CONTRACT_ADDRESSES.PatentNFT,
    PatentNFTAbi.abi,
    providerOrSigner
  );
};

// Add more contract interaction functions as needed