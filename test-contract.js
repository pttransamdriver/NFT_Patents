/**
 * Contract Diagnostic Test Script
 * Tests PatentNFT contract to identify issues
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const PATENT_NFT_ADDRESS = process.env.VITE_PATENT_NFT_ADDRESS;
const RPC_URL = process.env.VITE_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// PatentNFT ABI (minimal for testing)
const PATENT_NFT_ABI = [
  'function mintPatentNFT(address to, string memory patentNumber, string memory ipfsHash) external payable returns (uint256)',
  'function getMintingPrice() external view returns (uint256)',
  'function patentExists(string memory patentNumber) external view returns (bool)',
  'function patentTokenId(string memory patentNumber) external view returns (uint256)',
  'function owner() external view returns (address)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
];

async function runTests() {
  console.log('🔍 Starting Contract Diagnostic Tests...\n');

  try {
    // Setup
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(PATENT_NFT_ADDRESS, PATENT_NFT_ABI, signer);

    console.log('📋 Contract Information:');
    console.log(`   Address: ${PATENT_NFT_ADDRESS}`);
    console.log(`   Signer: ${signer.address}\n`);

    // Test 1: Check contract owner
    console.log('✅ Test 1: Contract Owner');
    const owner = await contract.owner();
    console.log(`   Owner: ${owner}`);
    console.log(`   Is signer owner? ${owner.toLowerCase() === signer.address.toLowerCase()}\n`);

    // Test 2: Check minting price
    console.log('✅ Test 2: Minting Price');
    const price = await contract.getMintingPrice();
    console.log(`   Price: ${ethers.formatEther(price)} ETH\n`);

    // Test 3: Check contract balance
    console.log('✅ Test 3: Contract Balance');
    const balance = await provider.getBalance(PATENT_NFT_ADDRESS);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH\n`);

    // Test 4: Check total supply
    console.log('✅ Test 4: Total Supply');
    const totalSupply = await contract.totalSupply();
    console.log(`   Total NFTs minted: ${totalSupply}\n`);

    // Test 5: Check if test patent exists
    console.log('✅ Test 5: Check Patent Existence');
    const testPatent = 'US10689145B2';
    const exists = await contract.patentExists(testPatent);
    console.log(`   Patent ${testPatent} exists? ${exists}`);
    if (exists) {
      const tokenId = await contract.patentTokenId(testPatent);
      console.log(`   Token ID: ${tokenId}\n`);
    } else {
      console.log('   Patent not minted yet\n');
    }

    // Test 6: Check signer balance
    console.log('✅ Test 6: Signer ETH Balance');
    const signerBalance = await provider.getBalance(signer.address);
    console.log(`   Balance: ${ethers.formatEther(signerBalance)} ETH`);
    console.log(`   Sufficient for mint? ${signerBalance >= price}\n`);

    console.log('✅ All diagnostic tests completed!');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error(error);
  }
}

runTests();

