const { ethers } = require('ethers');

const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
const CONTRACT_ADDRESS = '0xe4C3B9E04c1adf8224DD02006efAaa69c58d6E10';
const PATENT_NUMBER = 'US10226966B2';

const ABI = [
  'function patentExists(string memory patentNumber) public view returns (bool)',
  'function patentTokenId(string memory patentNumber) public view returns (uint256)',
  'function getMintingPrice() external view returns (uint256)'
];

async function checkPatent() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    
    console.log('Checking patent:', PATENT_NUMBER);
    console.log('Contract:', CONTRACT_ADDRESS);
    
    const exists = await contract.patentExists(PATENT_NUMBER);
    console.log('Patent exists:', exists);
    
    if (exists) {
      const tokenId = await contract.patentTokenId(PATENT_NUMBER);
      console.log('Token ID:', tokenId.toString());
    }
    
    const price = await contract.getMintingPrice();
    console.log('Minting price:', ethers.formatEther(price), 'ETH');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPatent();
