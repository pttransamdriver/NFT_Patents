import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🚀 Starting simple deployment...");
  
  // Get signer from Hardhat
  const [signer] = await ethers.getSigners();
  console.log("👤 Deployer:", signer.address);
  console.log("🌐 Network:", hre.network.name);
  
  try {
    // 1. Deploy PSP Token
    console.log("\n📦 Deploying PSP Token...");
    const PSPToken = await ethers.getContractFactory("PSPToken");
    const initialTokenPrice = ethers.parseEther("0.000004"); // 1 PSP = ~$0.01
    const pspToken = await PSPToken.deploy(initialTokenPrice);
    await pspToken.waitForDeployment();
    const pspTokenAddress = await pspToken.getAddress();
    console.log("✅ PSP Token deployed to:", pspTokenAddress);
    
    // 2. Deploy SearchPayment contract
    console.log("\n📦 Deploying SearchPayment contract...");
    const SearchPayment = await ethers.getContractFactory("SearchPayment");
    const usdcTokenAddress = "0x0000000000000000000000000000000000000001";
    const initialPriceInETH = ethers.parseEther("0.002");
    const initialPriceInUSDC = ethers.parseUnits("5", 6);
    const initialPriceInPSP = ethers.parseEther("500");
    
    const searchPayment = await SearchPayment.deploy(
      pspTokenAddress,
      usdcTokenAddress, 
      initialPriceInETH,
      initialPriceInUSDC,
      initialPriceInPSP
    );
    await searchPayment.waitForDeployment();
    const searchPaymentAddress = await searchPayment.getAddress();
    console.log("✅ SearchPayment deployed to:", searchPaymentAddress);
    
    // 3. Deploy PatentNFT contract
    console.log("\n📦 Deploying PatentNFT contract...");
    const PatentNFT = await ethers.getContractFactory("PatentNFT");
    const patentNFT = await PatentNFT.deploy();
    await patentNFT.waitForDeployment();
    const patentNFTAddress = await patentNFT.getAddress();
    console.log("✅ PatentNFT deployed to:", patentNFTAddress);
    
    console.log("\n🎉 All contracts deployed successfully!");
    console.log("📝 Contract Summary:");
    console.log(`💰 PSP Token: ${pspTokenAddress}`);
    console.log(`🔍 SearchPayment: ${searchPaymentAddress}`);
    console.log(`🎨 PatentNFT: ${patentNFTAddress}`);
    
    console.log("\n📝 Update your .env file with these addresses:");
    console.log(`VITE_PSP_TOKEN_ADDRESS=${pspTokenAddress}`);
    console.log(`VITE_SEARCH_PAYMENT_ADDRESS=${searchPaymentAddress}`);
    console.log(`VITE_PATENT_NFT_ADDRESS=${patentNFTAddress}`);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });