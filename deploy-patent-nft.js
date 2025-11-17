/**
 * Deploy PatentNFT Contract to Sepolia
 * Usage: node deploy-patent-nft.js
 */

import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const RPC_URL = process.env.VITE_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CHAIN_ID = parseInt(process.env.VITE_CHAIN_ID);

// Constructor parameters
const ROYALTY_RECEIVER = '0x9817253D86c09496A886bedBc4DDDC5bAe6ea215'; // Your address
const ROYALTY_FEE_NUMERATOR = 500; // 5%
const BASE_METADATA_URI = 'https://nft-patents-backend.vercel.app/api/metadata/';

async function deploy() {
  console.log('🚀 Deploying PatentNFT Contract...\n');

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('📋 Deployment Parameters:');
    console.log(`   Deployer: ${signer.address}`);
    console.log(`   Royalty Receiver: ${ROYALTY_RECEIVER}`);
    console.log(`   Royalty Fee: ${ROYALTY_FEE_NUMERATOR / 100}%`);
    console.log(`   Base Metadata URI: ${BASE_METADATA_URI}\n`);

    // Read contract ABI and bytecode
    const contractJson = JSON.parse(fs.readFileSync('./artifacts/contracts/PatentNFT.sol/PatentNFT.json', 'utf8'));
    const abi = contractJson.abi;
    const bytecode = contractJson.bytecode;

    // Create contract factory
    const factory = new ethers.ContractFactory(abi, bytecode, signer);

    // Deploy
    console.log('⏳ Deploying contract...');
    const contract = await factory.deploy(ROYALTY_RECEIVER, ROYALTY_FEE_NUMERATOR, BASE_METADATA_URI);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`✅ Contract deployed at: ${address}\n`);

    // Save deployment info
    const deployment = {
      address,
      deployer: signer.address,
      chainId: CHAIN_ID,
      timestamp: new Date().toISOString(),
      constructor: {
        royaltyReceiver: ROYALTY_RECEIVER,
        royaltyFeeNumerator: ROYALTY_FEE_NUMERATOR,
        baseMetadataURI: BASE_METADATA_URI
      }
    };

    fs.writeFileSync('./deployment-patent-nft.json', JSON.stringify(deployment, null, 2));
    console.log('📝 Deployment info saved to deployment-patent-nft.json\n');

    console.log('✅ Deployment complete!');
    console.log(`\n📌 Update your .env files with:`);
    console.log(`   VITE_PATENT_NFT_ADDRESS=${address}`);

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

deploy();

