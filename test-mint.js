/**
 * Minting Test Script
 * Tests the mintPatentNFT function with a real transaction
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const PATENT_NFT_ADDRESS = process.env.VITE_PATENT_NFT_ADDRESS;
const RPC_URL = process.env.VITE_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const PATENT_NFT_ABI = [
  'function mintPatentNFT(address to, string memory patentNumber, string memory ipfsHash) external payable returns (uint256)',
  'function getMintingPrice() external view returns (uint256)',
  'function patentExists(string memory patentNumber) external view returns (bool)',
];

async function testMint() {
  console.log('🚀 Starting Minting Test...\n');

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(PATENT_NFT_ADDRESS, PATENT_NFT_ABI, signer);

    // Test parameters
    const patentNumber = 'TEST_PATENT_' + Date.now();
    const ipfsHash = 'QmTest1234567890abcdefghijklmnopqrstuvwxyz123456';
    const to = signer.address;

    console.log('📝 Test Parameters:');
    console.log(`   Patent Number: ${patentNumber}`);
    console.log(`   IPFS Hash: ${ipfsHash}`);
    console.log(`   Recipient: ${to}\n`);

    // Get minting price
    const price = await contract.getMintingPrice();
    console.log(`💰 Minting Price: ${ethers.formatEther(price)} ETH\n`);

    // Check if patent already exists
    const exists = await contract.patentExists(patentNumber);
    console.log(`✅ Patent exists check: ${exists}\n`);

    // Estimate gas
    console.log('⛽ Estimating gas...');
    try {
      const gasEstimate = await contract.mintPatentNFT.estimateGas(to, patentNumber, ipfsHash, { value: price });
      console.log(`   Gas estimate: ${gasEstimate.toString()}\n`);
    } catch (gasError) {
      console.error('❌ Gas estimation failed:', gasError.message);
      console.error('   This indicates the transaction will fail!\n');
      return;
    }

    // Send transaction
    console.log('📤 Sending mint transaction...');
    const tx = await contract.mintPatentNFT(to, patentNumber, ipfsHash, { value: price });
    console.log(`   TX Hash: ${tx.hash}`);

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log(`   Confirmed in block: ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}\n`);

    console.log('✅ Minting test PASSED!');

  } catch (error) {
    console.error('❌ Minting test FAILED:', error.message);
    if (error.data) {
      console.error('   Error data:', error.data);
    }
    console.error(error);
  }
}

testMint();

