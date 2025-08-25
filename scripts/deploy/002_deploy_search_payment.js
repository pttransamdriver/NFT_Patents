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

export async function deploySearchPayment(networkName = "localhost", options = {}) {
  console.log("🚀 Deploying SearchPayment Contract...");
  
  const { provider, wallet, config } = createWallet(networkName);
  const { forceRedeploy = false } = options;
  
  // Check if redeployment is needed
  if (!await needsRedeployment(provider, networkName, "SearchPayment", forceRedeploy)) {
    return null;
  }
  
  console.log("👤 Deployer:", wallet.address);
  console.log("🌐 Network:", networkName);
  
  try {
    // Get PSP Token address from previous deployment
    const pspTokenDeployment = loadDeployment(networkName, "PSPToken");
    if (!pspTokenDeployment) {
      throw new Error("PSP Token must be deployed first. Run: node scripts/deploy/01-psp-token.js");
    }
    
    console.log("🔗 Using PSP Token at:", pspTokenDeployment.address);
    
    // Deploy SearchPayment
    const SearchPaymentArtifact = await hre.artifacts.readArtifact("SearchPayment");
    const SearchPaymentFactory = new ethers.ContractFactory(
      SearchPaymentArtifact.abi,
      SearchPaymentArtifact.bytecode,
      wallet
    );
    
    // Constructor parameters
    const pspTokenAddress = pspTokenDeployment.address;
    const usdcTokenAddress = "0x0000000000000000000000000000000000000001"; // Mock USDC for testing
    const initialPriceInETH = ethers.parseEther("0.002"); // $5 at $2500/ETH
    const initialPriceInUSDC = ethers.parseUnits("5", 6); // $5 USDC (6 decimals)
    const initialPriceInPSP = ethers.parseEther("500"); // 500 PSP tokens
    
    console.log("💰 Search Pricing Configuration:");
    console.log(`   ETH: ${ethers.formatEther(initialPriceInETH)} ETH (~$5.00)`);
    console.log(`   USDC: ${ethers.formatUnits(initialPriceInUSDC, 6)} USDC`);
    console.log(`   PSP: ${ethers.formatEther(initialPriceInPSP)} PSP tokens`);
    
    const searchPayment = await SearchPaymentFactory.deploy(
      pspTokenAddress,
      usdcTokenAddress,
      initialPriceInETH,
      initialPriceInUSDC,
      initialPriceInPSP
    );
    await searchPayment.waitForDeployment();
    
    const address = await searchPayment.getAddress();
    const deploymentTx = searchPayment.deploymentTransaction();
    
    console.log("✅ SearchPayment deployed to:", address);
    console.log("📃 Transaction hash:", deploymentTx.hash);
    
    // Verify deployment
    await verifyDeployment(provider, address, "SearchPayment");
    
    // Save deployment data
    const deploymentData = {
      address,
      deployer: wallet.address,
      constructorArgs: [
        pspTokenAddress,
        usdcTokenAddress,
        initialPriceInETH.toString(),
        initialPriceInUSDC.toString(),
        initialPriceInPSP.toString()
      ],
      deploymentTransaction: deploymentTx,
      dependencies: {
        pspToken: pspTokenAddress
      },
      pricing: {
        eth: ethers.formatEther(initialPriceInETH),
        usdc: ethers.formatUnits(initialPriceInUSDC, 6),
        psp: ethers.formatEther(initialPriceInPSP)
      }
    };
    
    const deployment = saveDeployment(networkName, "SearchPayment", deploymentData);
    updateEnvFile("SEARCH_PAYMENT", address);
    
    console.log("\n📊 SearchPayment Configuration:");
    console.log(`   🔗 PSP Token: ${pspTokenAddress}`);
    console.log(`   💰 ETH Price: ${ethers.formatEther(initialPriceInETH)} ETH`);
    console.log(`   💵 USDC Price: ${ethers.formatUnits(initialPriceInUSDC, 6)} USDC`);
    console.log(`   🪙 PSP Price: ${ethers.formatEther(initialPriceInPSP)} PSP`);
    
    return deployment;
    
  } catch (error) {
    console.error("❌ SearchPayment deployment failed:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const networkName = process.argv[2] || "localhost";
  const forceRedeploy = process.argv.includes("--force");
  
  deploySearchPayment(networkName, { forceRedeploy })
    .then((deployment) => {
      if (deployment) {
        console.log("\n🎉 SearchPayment deployment completed successfully!");
      } else {
        console.log("\n✅ SearchPayment already deployed, skipping.");
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment failed:", error);
      process.exit(1);
    });
}