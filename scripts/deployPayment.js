const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SearchPayment contract...");

  // Get the contract factory
  const SearchPayment = await ethers.getContractFactory("SearchPayment");

  // Calculate initial price: $15 USD in ETH
  // Assuming 1 ETH = $2000 (adjust based on current price)
  const ethPriceUSD = 2000;
  const usdPrice = 15;
  const initialPriceETH = usdPrice / ethPriceUSD;
  const initialPriceWei = ethers.parseEther(initialPriceETH.toString());

  console.log(`💰 Setting initial price: ${initialPriceETH} ETH (~$${usdPrice} USD)`);

  // Deploy the contract
  const searchPayment = await SearchPayment.deploy(initialPriceWei);
  await searchPayment.waitForDeployment();
  const searchPaymentAddress = await searchPayment.getAddress();

  console.log("✅ SearchPayment deployed to:", searchPaymentAddress);
  console.log("📋 Contract details:");
  console.log("   - Initial price:", ethers.formatEther(initialPriceWei), "ETH");
  console.log("   - Searches per payment:", 3);
  console.log("   - Owner:", await searchPayment.owner());

  // Verify contract on Etherscan (if on mainnet/testnet)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("⏳ Waiting for block confirmations...");
    await searchPayment.deployTransaction.wait(6);
    
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: searchPaymentAddress,
        constructorArguments: [initialPriceWei],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    contractAddress: searchPaymentAddress,
    network: network.name,
    initialPrice: initialPriceWei.toString(),
    initialPriceETH: initialPriceETH,
    deployedAt: new Date().toISOString(),
    deployer: (await ethers.getSigners())[0].address
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📄 Deployment info saved to deployment-info.json");
  console.log("\n🔧 Next steps:");
  console.log("1. Add contract address to .env file:");
  console.log(`   VITE_PAYMENT_CONTRACT_ADDRESS=${searchPaymentAddress}`);
  console.log("2. Update your frontend to use the contract");
  console.log("3. Test payments on testnet before mainnet deployment");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
