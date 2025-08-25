import hre from "hardhat";
import { ethers } from "ethers";
import {
  createWallet,
  saveDeployment,
  updateEnvFile,
  verifyDeployment,
  needsRedeployment
} from "../utils/deployment-utils.js";

export async function deployPSPToken(networkName = "localhost", options = {}) {
  console.log("🚀 Deploying PSP Token...");
  
  const { provider, wallet, config } = createWallet(networkName);
  const { forceRedeploy = false } = options;
  
  // Check if redeployment is needed
  if (!await needsRedeployment(provider, networkName, "PSPToken", forceRedeploy)) {
    return null;
  }
  
  console.log("👤 Deployer:", wallet.address);
  console.log("🌐 Network:", networkName);
  
  try {
    // Deploy PSP Token
    const PSPTokenArtifact = await hre.artifacts.readArtifact("PSPToken");
    const PSPTokenFactory = new ethers.ContractFactory(
      PSPTokenArtifact.abi, 
      PSPTokenArtifact.bytecode, 
      wallet
    );
    
    // Constructor parameters
    const initialTokenPrice = ethers.parseEther("0.000004"); // 1 PSP = ~$0.01 (at $2500/ETH)
    
    console.log(`💰 Initial PSP price: ${ethers.formatEther(initialTokenPrice)} ETH (~$0.01)`);
    
    const pspToken = await PSPTokenFactory.deploy(initialTokenPrice);
    await pspToken.waitForDeployment();
    
    const address = await pspToken.getAddress();
    const deploymentTx = pspToken.deploymentTransaction();
    
    console.log("✅ PSP Token deployed to:", address);
    console.log("📃 Transaction hash:", deploymentTx.hash);
    
    // Verify deployment
    await verifyDeployment(provider, address, "PSP Token");
    
    // Save deployment data
    const deploymentData = {
      address,
      deployer: wallet.address,
      constructorArgs: [initialTokenPrice.toString()],
      deploymentTransaction: deploymentTx,
      initialTokenPrice: ethers.formatEther(initialTokenPrice)
    };
    
    const deployment = saveDeployment(networkName, "PSPToken", deploymentData);
    updateEnvFile("PSP_TOKEN", address);
    
    // Display token info
    console.log("\n📊 PSP Token Configuration:");
    console.log(`   💰 Initial Price: ${ethers.formatEther(initialTokenPrice)} ETH`);
    console.log(`   🏪 Total Supply: 1,000,000 PSP`);
    console.log(`   💎 Max Supply: 10,000,000 PSP`);
    console.log(`   💵 Search Cost: 500 PSP (~$5.00)`);
    
    return deployment;
    
  } catch (error) {
    console.error("❌ PSP Token deployment failed:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const networkName = process.argv[2] || "localhost";
  const forceRedeploy = process.argv.includes("--force");
  
  deployPSPToken(networkName, { forceRedeploy })
    .then((deployment) => {
      if (deployment) {
        console.log("\n🎉 PSP Token deployment completed successfully!");
      } else {
        console.log("\n✅ PSP Token already deployed, skipping.");
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment failed:", error);
      process.exit(1);
    });
}