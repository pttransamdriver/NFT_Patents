import dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
import { ethers } from "ethers";
import {
  createWallet,
  saveDeployment,
  updateEnvFile,
  verifyDeployment,
  needsRedeployment,
  loadDeployment
} from "../utils/deployment-utils.js";

export async function deployNFTMarketplace(networkName = "localhost", options = {}) {
  console.log("🚀 Deploying NFTMarketplace Contract...");
  
  const { provider, wallet, config } = createWallet(networkName);
  const { forceRedeploy = false } = options;
  
  // Check if redeployment is needed
  if (!await needsRedeployment(provider, networkName, "NFTMarketplace", forceRedeploy)) {
    return null;
  }
  
  console.log("👤 Deployer:", wallet.address);
  console.log("🌐 Network:", networkName);
  
  try {
    // Get PatentNFT address from previous deployment
    const patentNFTDeployment = loadDeployment(networkName, "PatentNFT");
    if (!patentNFTDeployment) {
      throw new Error("PatentNFT must be deployed first. Run: node scripts/deploy/03-patent-nft.js");
    }
    
    console.log("🔗 Using PatentNFT at:", patentNFTDeployment.address);
    
    // Deploy NFTMarketplace
    const NFTMarketplaceArtifact = await hre.artifacts.readArtifact("NFTMarketplace");
    const NFTMarketplaceFactory = new ethers.ContractFactory(
      NFTMarketplaceArtifact.abi,
      NFTMarketplaceArtifact.bytecode,
      wallet
    );
    
    console.log("🏪 Deploying NFT Marketplace contract...");
    
    // Constructor parameter: fee recipient (deployer as default)
    const feeRecipient = wallet.address;
    console.log("💰 Fee recipient:", feeRecipient);
    
    const marketplace = await NFTMarketplaceFactory.deploy(feeRecipient);
    await marketplace.waitForDeployment();
    
    const address = await marketplace.getAddress();
    const deploymentTx = marketplace.deploymentTransaction();
    
    console.log("✅ NFTMarketplace deployed to:", address);
    console.log("📃 Transaction hash:", deploymentTx.hash);
    
    // Verify deployment
    await verifyDeployment(provider, address, "NFTMarketplace");
    
    // Get initial contract state
    const owner = await marketplace.owner();
    const platformFee = await marketplace.platformFeePercent();
    const retrievedFeeRecipient = await marketplace.feeRecipient();
    
    console.log("\n📊 NFTMarketplace Contract Info:");
    console.log(`   👤 Owner: ${owner}`);
    console.log(`   💰 Fee Recipient: ${retrievedFeeRecipient}`);
    console.log(`   💰 Platform Fee: ${Number(platformFee) / 100}% (${platformFee} basis points)`);
    
    // Save deployment data
    const deploymentData = {
      address,
      deployer: wallet.address,
      constructorArgs: [feeRecipient],
      deploymentTransaction: deploymentTx,
      dependencies: {
        patentNFT: patentNFTDeployment.address
      },
      contractInfo: {
        owner,
        feeRecipient: retrievedFeeRecipient,
        platformFee: platformFee.toString(),
        platformFeePercent: (Number(platformFee) / 100).toString()
      }
    };
    
    const deployment = saveDeployment(networkName, "NFTMarketplace", deploymentData);
    updateEnvFile("MARKETPLACE", address);
    
    console.log("\n🏪 NFTMarketplace Features:");
    console.log("   ✅ Buy and sell Patent NFTs");
    console.log(`   ✅ ${Number(platformFee) / 100}% platform fee collection`);
    console.log("   ✅ Listing and delisting functionality"); 
    console.log("   ✅ Real-time marketplace data");
    console.log("   ✅ Secure payment processing");
    
    return deployment;
    
  } catch (error) {
    console.error("❌ NFTMarketplace deployment failed:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const networkName = process.argv[2] || "localhost";
  const forceRedeploy = process.argv.includes("--force");
  
  deployNFTMarketplace(networkName, { forceRedeploy })
    .then((deployment) => {
      if (deployment) {
        console.log("\n🎉 NFTMarketplace deployment completed successfully!");
      } else {
        console.log("\n✅ NFTMarketplace already deployed, skipping.");
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment failed:", error);
      process.exit(1);
    });
}