import { task } from "hardhat/config.js";
import { getAllDeployments, verifyDeployment, createWallet } from "../utils/deployment-utils.js";

// Hardhat task to verify all contracts
task("verify-contracts", "Verify all deployed contracts")
  .addOptionalParam("network", "Network to verify contracts on", "localhost")
  .setAction(async (taskArgs, hre) => {
    const networkName = taskArgs.network;
    console.log(`🔍 Verifying contracts on ${networkName}...`);
    
    const { provider } = createWallet(networkName);
    const deployments = getAllDeployments(networkName);
    
    if (Object.keys(deployments).length === 0) {
      console.log("❌ No deployments found for network:", networkName);
      return;
    }
    
    let verified = 0;
    const total = Object.keys(deployments).length;
    
    for (const [contractName, deployment] of Object.entries(deployments)) {
      const isVerified = await verifyDeployment(provider, deployment.address, contractName);
      if (isVerified) verified++;
    }
    
    console.log(`\n📊 Verification Result: ${verified}/${total} contracts verified`);
    
    if (verified === total) {
      console.log("🎉 All contracts verified successfully!");
    } else {
      console.log("⚠️  Some contracts failed verification.");
      process.exit(1);
    }
  });

export default {};