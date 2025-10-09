const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔄 Unpausing all contracts...");
  
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
  
  // Confirmation prompt
  console.log("⚠️  WARNING: You are about to unpause all contracts");
  console.log("Make sure you have:");
  console.log("1. ✅ Identified and fixed the security issue");
  console.log("2. ✅ Tested the fix thoroughly");
  console.log("3. ✅ Verified all systems are secure");
  console.log("");
  
  // In a real scenario, you might want to add an interactive prompt here
  // For now, we'll proceed with a warning
  
  try {
    // Unpause PSP Token
    console.log("Unpausing PSP Token contract...");
    const PSPToken = await ethers.getContractFactory("PSPToken");
    const pspToken = PSPToken.attach(PSP_TOKEN_ADDRESS);
    
    const isPaused = await pspToken.paused();
    if (isPaused) {
      const tx1 = await pspToken.unpause();
      await tx1.wait();
      console.log("✅ PSP Token unpaused");
    } else {
      console.log("ℹ️ PSP Token already unpaused");
    }
    
    // Unpause Search Payment
    console.log("Unpausing Search Payment contract...");
    const SearchPayment = await ethers.getContractFactory("SearchPayment");
    const searchPayment = SearchPayment.attach(SEARCH_PAYMENT_ADDRESS);
    
    const isPaymentPaused = await searchPayment.paused();
    if (isPaymentPaused) {
      const tx2 = await searchPayment.unpause();
      await tx2.wait();
      console.log("✅ Search Payment unpaused");
    } else {
      console.log("ℹ️ Search Payment already unpaused");
    }
    
    console.log("🎉 All contracts successfully unpaused");
    console.log("📝 Post-unpause checklist:");
    console.log("1. Monitor contract interactions closely");
    console.log("2. Check for any unusual activity");
    console.log("3. Verify all functions work correctly");
    console.log("4. Update users about service restoration");
    
  } catch (error) {
    console.error("❌ Error unpausing contracts:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
