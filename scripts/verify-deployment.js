import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import {
  createWallet,
  getAllDeployments,
  verifyDeployment
} from "./utils/deployment-utils.js";

async function verifyAllDeployments() {
  const networkName = process.argv[2] || "localhost";
  
  console.log("🔍 Verifying all deployments...");
  console.log("🌐 Network:", networkName);
  console.log("━".repeat(50));
  
  try {
    const { provider } = createWallet(networkName);
    const deployments = getAllDeployments(networkName);
    
    if (Object.keys(deployments).length === 0) {
      console.log("❌ No deployments found for network:", networkName);
      return;
    }
    
    const verificationResults = {};
    
    for (const [contractName, deployment] of Object.entries(deployments)) {
      console.log(`\n🔍 Verifying ${contractName}...`);
      const isVerified = await verifyDeployment(provider, deployment.address, contractName);
      verificationResults[contractName] = {
        address: deployment.address,
        verified: isVerified,
        deployedAt: deployment.deploymentTime
      };
      
      if (isVerified) {
        // Additional checks
        const balance = await provider.getBalance(deployment.address);
        const nonce = await provider.getTransactionCount(deployment.address);
        
        console.log(`   💰 Contract Balance: ${ethers.formatEther(balance)} ETH`);
        console.log(`   📊 Transaction Count: ${nonce}`);
        console.log(`   📅 Deployed: ${new Date(deployment.deploymentTime).toLocaleString()}`);
      }
    }
    
    // Summary
    console.log("\n🎯 Verification Summary:");
    console.log("━".repeat(50));
    
    const verified = Object.values(verificationResults).filter(r => r.verified).length;
    const total = Object.keys(verificationResults).length;
    
    for (const [name, result] of Object.entries(verificationResults)) {
      const status = result.verified ? "✅" : "❌";
      console.log(`${status} ${name}: ${result.address}`);
    }
    
    console.log(`\n📊 Overall Status: ${verified}/${total} contracts verified`);
    
    if (verified === total) {
      console.log("🎉 All contracts verified successfully!");
    } else {
      console.log("⚠️  Some contracts failed verification. Check deployment status.");
      process.exit(1);
    }
    
  } catch (error) {
    console.error("💥 Verification failed:", error);
    process.exit(1);
  }
}

verifyAllDeployments()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });