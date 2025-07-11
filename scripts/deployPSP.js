import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🚀 Deploying PSP Token Contract...");

  // Get the contract factory
  const PSPToken = await ethers.getContractFactory("PSPToken");

  // Calculate initial token price
  // Assuming 1 PSP = $0.01 USD and 1 ETH = $2000 USD
  // 1 PSP = 0.000005 ETH = 5000000000000 wei
  const initialTokenPrice = ethers.parseUnits("5000000000000", "wei"); // 0.000005 ETH per PSP

  console.log(`📊 Initial PSP Token Price: ${ethers.formatEther(initialTokenPrice)} ETH per PSP`);
  console.log(`💰 This equals approximately $0.01 USD per PSP (assuming ETH = $2000)`);

  // Deploy the contract
  const pspToken = await PSPToken.deploy(initialTokenPrice);
  await pspToken.waitForDeployment();

  const contractAddress = await pspToken.getAddress();
  console.log(`✅ PSP Token deployed to: ${contractAddress}`);

  // Get deployment details
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  
  console.log("\n📋 Deployment Summary:");
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💎 Deployer Balance: ${ethers.formatEther(deployerBalance)} ETH`);
  console.log(`🏭 Contract Address: ${contractAddress}`);
  console.log(`🪙 Token Name: Patent Search Pennies`);
  console.log(`🔤 Token Symbol: PSP`);
  console.log(`🔢 Decimals: 18`);
  console.log(`📦 Initial Supply: 1,000,000 PSP`);
  console.log(`🎯 Max Supply: 10,000,000 PSP`);
  console.log(`💲 Initial Price: ${ethers.formatEther(initialTokenPrice)} ETH per PSP`);

  // Verify token details
  try {
    const name = await pspToken.name();
    const symbol = await pspToken.symbol();
    const decimals = await pspToken.decimals();
    const totalSupply = await pspToken.totalSupply();
    const tokenPrice = await pspToken.getTokenPrice();
    const deployerTokenBalance = await pspToken.balanceOf(deployer.address);

    console.log("\n🔍 Contract Verification:");
    console.log(`✅ Name: ${name}`);
    console.log(`✅ Symbol: ${symbol}`);
    console.log(`✅ Decimals: ${decimals}`);
    console.log(`✅ Total Supply: ${ethers.formatUnits(totalSupply, decimals)} PSP`);
    console.log(`✅ Token Price: ${ethers.formatEther(tokenPrice)} ETH per PSP`);
    console.log(`✅ Deployer Token Balance: ${ethers.formatUnits(deployerTokenBalance, decimals)} PSP`);
  } catch (error) {
    console.log("⚠️ Could not verify contract details:", error.message);
  }

  // Test token purchase calculation
  const testETHAmount = ethers.parseEther("0.01"); // 0.01 ETH
  try {
    const tokensForETH = await pspToken.calculateTokensForETH(testETHAmount);
    console.log(`\n🧮 Test Calculation:`);
    console.log(`💰 0.01 ETH would purchase: ${ethers.formatEther(tokensForETH)} PSP tokens`);
  } catch (error) {
    console.log("⚠️ Could not calculate test purchase:", error.message);
  }

  console.log("\n📝 Next Steps:");
  console.log("1. Add the contract address to your .env file:");
  console.log(`   VITE_PSP_TOKEN_ADDRESS=${contractAddress}`);
  console.log("2. Deploy the SearchPayment contract with this PSP token address");
  console.log("3. Test token purchases and payments on testnet");
  console.log("4. Verify the contract on Etherscan for transparency");

  // Save deployment info to file
  const fs = await import('fs');
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    tokenName: "Patent Search Pennies",
    tokenSymbol: "PSP",
    decimals: 18,
    initialSupply: "1000000",
    maxSupply: "10000000",
    initialTokenPrice: initialTokenPrice.toString(),
    transactionHash: pspToken.deploymentTransaction()?.hash
  };

  fs.default.writeFileSync(
    `deployments/PSPToken_${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n💾 Deployment info saved to: deployments/PSPToken_${hre.network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
