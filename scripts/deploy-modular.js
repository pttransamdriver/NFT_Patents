import dotenv from "dotenv";
dotenv.config();

import { deployPSPToken } from "./deploy/001_deploy_psp_token.js";
import { deploySearchPayment } from "./deploy/002_deploy_search_payment.js";
import { deployPatentNFT } from "./deploy/003_deploy_patent_nft.js";
import { deployNFTMarketplace } from "./deploy/004_deploy_marketplace.js";
import {
  getAllDeployments,
  displayDeploymentSummary
} from "./utils/deployment-utils.js";

async function main() {
  const networkName = process.argv[2] || "localhost";
  const forceRedeploy = process.argv.includes("--force");
  
  console.log("🚀 Starting modular deployment...");
  console.log("🌐 Network:", networkName);
  console.log("🔄 Force redeploy:", forceRedeploy ? "Yes" : "No");
  console.log("━".repeat(50));
  
  const deploymentResults = {};
  const options = { forceRedeploy };
  
  try {
    // 1. Deploy PSP Token
    console.log("\n📦 Step 1/4: PSP Token");
    const pspDeployment = await deployPSPToken(networkName, options);
    if (pspDeployment) deploymentResults.PSPToken = pspDeployment;
    
    // 2. Deploy SearchPayment
    console.log("\n📦 Step 2/4: SearchPayment");
    const searchPaymentDeployment = await deploySearchPayment(networkName, options);
    if (searchPaymentDeployment) deploymentResults.SearchPayment = searchPaymentDeployment;
    
    // 3. Deploy PatentNFT
    console.log("\n📦 Step 3/4: PatentNFT");
    const patentNFTDeployment = await deployPatentNFT(networkName, options);
    if (patentNFTDeployment) deploymentResults.PatentNFT = patentNFTDeployment;
    
    // 4. Deploy NFTMarketplace
    console.log("\n📦 Step 4/4: NFTMarketplace");
    const marketplaceDeployment = await deployNFTMarketplace(networkName, options);
    if (marketplaceDeployment) deploymentResults.NFTMarketplace = marketplaceDeployment;
    
    // Display final summary
    const allDeployments = getAllDeployments(networkName);
    displayDeploymentSummary(allDeployments, networkName);
    
    // Show next steps
    console.log("🎯 Next Steps:");
    console.log("1. ✅ All contracts deployed and verified");
    console.log("2. 🔗 Contract addresses updated in .env file");
    console.log("3. 🌐 Frontend can now connect to all contracts");
    console.log("4. 🎨 Visit /search to search patents and mint NFTs");
    console.log("5. 🏪 Visit /marketplace to trade Patent NFTs");
    
    if (Object.keys(deploymentResults).length > 0) {
      console.log(`\n✨ ${Object.keys(deploymentResults).length} contracts deployed successfully!`);
    } else {
      console.log("\n✅ All contracts were already deployed and verified.");
    }
    
  } catch (error) {
    console.error("\n💥 Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });