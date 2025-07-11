import hre from "hardhat";
import fs from 'fs';
const { ethers } = hre;

async function main() {
  console.log("🔐 Setting up PSP Token Authorization...");

  const networkName = hre.network.name;
  
  // Load deployment addresses
  const pspDeploymentPath = `deployments/PSPToken_${networkName}.json`;
  const searchPaymentDeploymentPath = `deployments/SearchPayment_${networkName}.json`;
  
  if (!fs.existsSync(pspDeploymentPath)) {
    throw new Error(`PSP Token deployment not found: ${pspDeploymentPath}`);
  }
  
  if (!fs.existsSync(searchPaymentDeploymentPath)) {
    throw new Error(`SearchPayment deployment not found: ${searchPaymentDeploymentPath}`);
  }

  const pspDeployment = JSON.parse(fs.readFileSync(pspDeploymentPath, 'utf8'));
  const searchPaymentDeployment = JSON.parse(fs.readFileSync(searchPaymentDeploymentPath, 'utf8'));

  const pspTokenAddress = pspDeployment.contractAddress;
  const searchPaymentAddress = searchPaymentDeployment.contractAddress;

  console.log(`🪙 PSP Token: ${pspTokenAddress}`);
  console.log(`💳 SearchPayment: ${searchPaymentAddress}`);

  // Get contract instances
  const PSPToken = await ethers.getContractFactory("PSPToken");
  const pspToken = PSPToken.attach(pspTokenAddress);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Check current authorization status
  const isCurrentlyAuthorized = await pspToken.authorizedSpenders(searchPaymentAddress);
  console.log(`🔍 Current Authorization Status: ${isCurrentlyAuthorized ? '✅ Authorized' : '❌ Not Authorized'}`);

  if (isCurrentlyAuthorized) {
    console.log("✅ SearchPayment contract is already authorized to spend PSP tokens!");
    return;
  }

  // Authorize the SearchPayment contract
  console.log("🚀 Authorizing SearchPayment contract to spend PSP tokens...");
  
  try {
    const tx = await pspToken.setAuthorizedSpender(searchPaymentAddress, true);
    console.log(`📝 Transaction submitted: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

    // Verify authorization
    const isNowAuthorized = await pspToken.authorizedSpenders(searchPaymentAddress);
    console.log(`🔍 New Authorization Status: ${isNowAuthorized ? '✅ Authorized' : '❌ Still Not Authorized'}`);

    if (isNowAuthorized) {
      console.log("\n🎉 SUCCESS! SearchPayment contract is now authorized to spend PSP tokens.");
      console.log("Users can now pay for searches using PSP tokens!");
    } else {
      console.log("\n❌ FAILED! Authorization was not successful. Please check the transaction.");
    }

  } catch (error) {
    console.error("❌ Authorization failed:", error.message);
    
    if (error.message.includes("Ownable: caller is not the owner")) {
      console.log("\n💡 TIP: Make sure you're using the same account that deployed the PSP token contract.");
      console.log("Only the contract owner can authorize spenders.");
    }
    
    throw error;
  }

  // Display system status
  console.log("\n📊 System Status:");
  try {
    const tokenName = await pspToken.name();
    const tokenSymbol = await pspToken.symbol();
    const totalSupply = await pspToken.totalSupply();
    const tokenPrice = await pspToken.getTokenPrice();
    const deployerBalance = await pspToken.balanceOf(deployer.address);

    console.log(`🪙 Token: ${tokenName} (${tokenSymbol})`);
    console.log(`📦 Total Supply: ${ethers.formatEther(totalSupply)} PSP`);
    console.log(`💲 Token Price: ${ethers.formatEther(tokenPrice)} ETH per PSP`);
    console.log(`👤 Deployer Balance: ${ethers.formatEther(deployerBalance)} PSP`);

    // Get search payment details
    const SearchPayment = await ethers.getContractFactory("SearchPayment");
    const searchPayment = SearchPayment.attach(searchPaymentAddress);
    
    const searchPrice = await searchPayment.getSearchPrice();
    console.log(`🔍 Search Price: ${ethers.formatEther(searchPrice)} PSP ($5.00 USD)`);

  } catch (error) {
    console.log("⚠️ Could not fetch system status:", error.message);
  }

  console.log("\n📝 Next Steps:");
  console.log("1. Test the complete payment flow:");
  console.log("   - Purchase PSP tokens with ETH");
  console.log("   - Use PSP tokens to pay for searches");
  console.log("2. Update your frontend environment variables");
  console.log("3. Test on testnet before mainnet deployment");
  console.log("4. Monitor token usage and system performance");

  // Save authorization info
  const authorizationInfo = {
    network: networkName,
    timestamp: new Date().toISOString(),
    pspTokenAddress: pspTokenAddress,
    searchPaymentAddress: searchPaymentAddress,
    authorizationTxHash: tx?.hash || "completed",
    authorizedBy: deployer.address,
    status: "authorized"
  };

  fs.writeFileSync(
    `deployments/Authorization_${networkName}.json`,
    JSON.stringify(authorizationInfo, null, 2)
  );

  console.log(`\n💾 Authorization info saved to: deployments/Authorization_${networkName}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
