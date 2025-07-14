const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚨 EMERGENCY: Pausing all contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  // Get contract addresses from environment or deployments
  const PSP_TOKEN_ADDRESS = process.env.VITE_PSP_TOKEN_ADDRESS;
  const SEARCH_PAYMENT_ADDRESS = process.env.VITE_SEARCH_PAYMENT_ADDRESS;
  
  if (!PSP_TOKEN_ADDRESS || !SEARCH_PAYMENT_ADDRESS) {
    console.error("❌ Contract addresses not found in environment variables");
    console.log("Please set VITE_PSP_TOKEN_ADDRESS and VITE_SEARCH_PAYMENT_ADDRESS");
    process.exit(1);
  }
  
  try {
    // Pause PSP Token
    console.log("Pausing PSP Token contract...");
    const PSPToken = await ethers.getContractFactory("PSPToken");
    const pspToken = PSPToken.attach(PSP_TOKEN_ADDRESS);
    
    const isPaused = await pspToken.paused();
    if (!isPaused) {
      const tx1 = await pspToken.pause();
      await tx1.wait();
      console.log("✅ PSP Token paused");
    } else {
      console.log("ℹ️ PSP Token already paused");
    }
    
    // Pause Search Payment
    console.log("Pausing Search Payment contract...");
    const SearchPayment = await ethers.getContractFactory("SearchPayment");
    const searchPayment = SearchPayment.attach(SEARCH_PAYMENT_ADDRESS);
    
    const isPaymentPaused = await searchPayment.paused();
    if (!isPaymentPaused) {
      const tx2 = await searchPayment.pause();
      await tx2.wait();
      console.log("✅ Search Payment paused");
    } else {
      console.log("ℹ️ Search Payment already paused");
    }
    
    console.log("🛡️ All contracts successfully paused");
    console.log("📝 Next steps:");
    console.log("1. Investigate the security issue");
    console.log("2. Prepare fix if needed");
    console.log("3. Test thoroughly");
    console.log("4. Unpause when safe");
    
  } catch (error) {
    console.error("❌ Error pausing contracts:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
