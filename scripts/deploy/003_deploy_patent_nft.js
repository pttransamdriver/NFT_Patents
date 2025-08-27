import dotenv from "dotenv";
dotenv.config();

import hre from "hardhat";
import { ethers } from "ethers";
import {
  createWallet,
  saveDeployment,
  updateEnvFile,
  verifyDeployment,
  needsRedeployment
} from "../utils/deployment-utils.js";

export async function deployPatentNFT(networkName = "localhost", options = {}) {
  console.log("🚀 Deploying PatentNFT Contract...");
  
  const { provider, wallet, config } = createWallet(networkName);
  const { forceRedeploy = false } = options;
  
  // Check if redeployment is needed
  if (!await needsRedeployment(provider, networkName, "PatentNFT", forceRedeploy)) {
    return null;
  }
  
  console.log("👤 Deployer:", wallet.address);
  console.log("🌐 Network:", networkName);
  
  try {
    // Deploy PatentNFT
    const PatentNFTArtifact = await hre.artifacts.readArtifact("PatentNFT");
    const PatentNFTFactory = new ethers.ContractFactory(
      PatentNFTArtifact.abi,
      PatentNFTArtifact.bytecode,
      wallet
    );
    
    console.log("📄 Deploying ERC721 Patent NFT contract...");
    
    const patentNFT = await PatentNFTFactory.deploy();
    await patentNFT.waitForDeployment();
    
    const address = await patentNFT.getAddress();
    const deploymentTx = patentNFT.deploymentTransaction();
    
    console.log("✅ PatentNFT deployed to:", address);
    console.log("📃 Transaction hash:", deploymentTx.hash);
    
    // Verify deployment
    await verifyDeployment(provider, address, "PatentNFT");
    
    // Get initial contract state
    const name = await patentNFT.name();
    const symbol = await patentNFT.symbol();
    const owner = await patentNFT.owner();
    const mintingPrice = await patentNFT.getMintingPrice();
    
    console.log("\n📊 PatentNFT Contract Info:");
    console.log(`   📛 Name: ${name}`);
    console.log(`   🏷️  Symbol: ${symbol}`);
    console.log(`   👤 Owner: ${owner}`);
    console.log(`   💰 Minting Price: ${ethers.formatEther(mintingPrice)} ETH`);
    
    // Save deployment data
    const deploymentData = {
      address,
      deployer: wallet.address,
      constructorArgs: [],
      deploymentTransaction: deploymentTx,
      contractInfo: {
        name,
        symbol,
        owner,
        mintingPrice: ethers.formatEther(mintingPrice)
      }
    };
    
    const deployment = saveDeployment(networkName, "PatentNFT", deploymentData);
    updateEnvFile("PATENT_NFT", address);
    
    console.log("\n🎨 PatentNFT Features:");
    console.log("   ✅ ERC721 compliant NFT contract");
    console.log("   ✅ Patent uniqueness enforcement");
    console.log("   ✅ Metadata URI support");
    console.log("   ✅ Owner verification system");
    console.log("   ✅ Fee collection mechanism");
    
    return deployment;
    
  } catch (error) {
    console.error("❌ PatentNFT deployment failed:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const networkName = process.argv[2] || "localhost";
  const forceRedeploy = process.argv.includes("--force");
  
  deployPatentNFT(networkName, { forceRedeploy })
    .then((deployment) => {
      if (deployment) {
        console.log("\n🎉 PatentNFT deployment completed successfully!");
      } else {
        console.log("\n✅ PatentNFT already deployed, skipping.");
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment failed:", error);
      process.exit(1);
    });
}