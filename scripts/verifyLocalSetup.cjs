const hre = require("hardhat");

async function main() {
  console.log("🔍 Verifying Local Setup...");
  
  try {
    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Connected account:", deployer.address);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
    
    // Check network
    const network = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());
    
    // Load contract addresses from environment or deployment files
    const pspAddress = process.env.VITE_PSP_TOKEN_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const searchPaymentAddress = process.env.VITE_SEARCH_PAYMENT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const patentNFTAddress = process.env.VITE_PATENT_NFT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    console.log("\n📋 Contract Addresses:");
    console.log("🪙 PSP Token:", pspAddress);
    console.log("💳 SearchPayment:", searchPaymentAddress);
    console.log("🖼️  PatentNFT:", patentNFTAddress);
    
    // Test PSP Token contract
    console.log("\n🧪 Testing PSP Token Contract...");
    const PSPToken = await hre.ethers.getContractFactory("PSPToken");
    const pspToken = PSPToken.attach(pspAddress);
    
    const tokenName = await pspToken.name();
    const tokenSymbol = await pspToken.symbol();
    const pspTotalSupply = await pspToken.totalSupply();
    const tokenPrice = await pspToken.getTokenPrice();

    console.log("✅ Token Name:", tokenName);
    console.log("✅ Token Symbol:", tokenSymbol);
    console.log("✅ Total Supply:", hre.ethers.formatEther(pspTotalSupply), "PSP");
    console.log("✅ Token Price:", hre.ethers.formatEther(tokenPrice), "ETH per PSP");
    
    // Test SearchPayment contract
    console.log("\n🧪 Testing SearchPayment Contract...");
    const SearchPayment = await hre.ethers.getContractFactory("SearchPayment");
    const searchPayment = SearchPayment.attach(searchPaymentAddress);

    const [ethPrice, usdcPrice, pspPrice] = await searchPayment.getAllSearchPrices();
    const isAuthorized = await pspToken.authorizedSpenders(searchPaymentAddress);

    console.log("✅ ETH Price:", hre.ethers.formatEther(ethPrice), "ETH");
    console.log("✅ USDC Price:", hre.ethers.formatUnits(usdcPrice, 6), "USDC");
    console.log("✅ PSP Price:", hre.ethers.formatEther(pspPrice), "PSP");
    console.log("✅ PSP Authorization:", isAuthorized ? "✅ Authorized" : "❌ Not Authorized");
    
    // Test PatentNFT contract
    console.log("\n🧪 Testing PatentNFT Contract...");
    const PatentNFT = await hre.ethers.getContractFactory("PatentNFT");
    const patentNFT = PatentNFT.attach(patentNFTAddress);
    
    const nftName = await patentNFT.name();
    const nftSymbol = await patentNFT.symbol();
    const mintingPrice = await patentNFT.getMintingPrice();
    const nftTotalSupply = await patentNFT.totalSupply();

    console.log("✅ NFT Name:", nftName);
    console.log("✅ NFT Symbol:", nftSymbol);
    console.log("✅ Minting Price:", hre.ethers.formatEther(mintingPrice), "ETH");
    console.log("✅ Total Supply:", nftTotalSupply.toString(), "NFTs");
    
    // Test a small PSP token purchase
    console.log("\n🧪 Testing PSP Token Purchase...");
    const purchaseAmount = hre.ethers.parseEther("0.001"); // 0.001 ETH
    const expectedTokens = await pspToken.calculateTokensForETH(purchaseAmount);
    
    console.log("💰 Purchase Amount:", hre.ethers.formatEther(purchaseAmount), "ETH");
    console.log("🪙 Expected Tokens:", hre.ethers.formatEther(expectedTokens), "PSP");
    
    console.log("\n🎉 All tests passed! Your local setup is working correctly.");
    console.log("\n📝 Next Steps:");
    console.log("1. Open your app at: http://127.0.0.1:5173/NFT_Patents/");
    console.log("2. Connect MetaMask to localhost network (Chain ID: 31337)");
    console.log("3. Import test account with private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    console.log("4. Test wallet connection and transactions");
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Make sure Hardhat node is running: npx hardhat node");
    console.log("2. Make sure contracts are deployed: npm run deploy-psp && npm run deploy-search-payment");
    console.log("3. Check your .env file has correct contract addresses");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
