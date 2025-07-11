import hre from "hardhat";
import fs from 'fs';
const { ethers } = hre;

async function main() {
  console.log("🚀 Deploying SearchPayment Contract...");

  // Check if PSP token deployment exists
  const networkName = hre.network.name;
  const pspDeploymentPath = `deployments/PSPToken_${networkName}.json`;
  
  let pspTokenAddress;
  if (fs.existsSync(pspDeploymentPath)) {
    const pspDeployment = JSON.parse(fs.readFileSync(pspDeploymentPath, 'utf8'));
    pspTokenAddress = pspDeployment.contractAddress;
    console.log(`📋 Found PSP Token deployment: ${pspTokenAddress}`);
  } else {
    // Fallback: ask for PSP token address
    console.log("⚠️ PSP Token deployment not found. Please provide the PSP token address:");
    console.log("You can set it as an environment variable: PSP_TOKEN_ADDRESS=0x...");
    
    pspTokenAddress = process.env.PSP_TOKEN_ADDRESS;
    if (!pspTokenAddress) {
      throw new Error("PSP_TOKEN_ADDRESS environment variable not set and no deployment file found");
    }
  }

  // Validate PSP token address
  if (!ethers.isAddress(pspTokenAddress)) {
    throw new Error(`Invalid PSP token address: ${pspTokenAddress}`);
  }

  // Get the contract factory
  const SearchPayment = await ethers.getContractFactory("SearchPayment");

  // Set search price: 500 PSP tokens = 500 * 10^18 wei (since PSP has 18 decimals)
  const searchPriceInPSP = ethers.parseUnits("500", 18); // 500 PSP tokens

  console.log(`🎯 Search Price: ${ethers.formatUnits(searchPriceInPSP, 18)} PSP tokens`);
  console.log(`💰 This equals $5.00 USD (500 PSP × $0.01 per PSP)`);

  // Deploy the contract
  const searchPayment = await SearchPayment.deploy(pspTokenAddress, searchPriceInPSP);
  await searchPayment.waitForDeployment();

  const contractAddress = await searchPayment.getAddress();
  console.log(`✅ SearchPayment deployed to: ${contractAddress}`);

  // Get deployment details
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  
  console.log("\n📋 Deployment Summary:");
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💎 Deployer Balance: ${ethers.formatEther(deployerBalance)} ETH`);
  console.log(`🏭 Contract Address: ${contractAddress}`);
  console.log(`🪙 PSP Token Address: ${pspTokenAddress}`);
  console.log(`💲 Search Price: ${ethers.formatUnits(searchPriceInPSP, 18)} PSP`);

  // Verify contract details
  try {
    const pspToken = await searchPayment.getPSPTokenAddress();
    const searchPrice = await searchPayment.getSearchPrice();
    const searchesPerPayment = await searchPayment.getSearchesPerPayment();

    console.log("\n🔍 Contract Verification:");
    console.log(`✅ PSP Token: ${pspToken}`);
    console.log(`✅ Search Price: ${ethers.formatUnits(searchPrice, 18)} PSP`);
    console.log(`✅ Searches Per Payment: ${searchesPerPayment}`);
    console.log(`✅ Contract Owner: ${await searchPayment.owner()}`);
  } catch (error) {
    console.log("⚠️ Could not verify contract details:", error.message);
  }

  // Test PSP token integration
  try {
    const PSPToken = await ethers.getContractFactory("PSPToken");
    const pspToken = PSPToken.attach(pspTokenAddress);
    
    const tokenName = await pspToken.name();
    const tokenSymbol = await pspToken.symbol();
    const tokenDecimals = await pspToken.decimals();
    
    console.log("\n🔗 PSP Token Integration:");
    console.log(`✅ Token Name: ${tokenName}`);
    console.log(`✅ Token Symbol: ${tokenSymbol}`);
    console.log(`✅ Token Decimals: ${tokenDecimals}`);
    
    // Check if SearchPayment contract is authorized to spend tokens
    const isAuthorized = await pspToken.authorizedSpenders(contractAddress);
    console.log(`🔐 Authorized Spender: ${isAuthorized ? '✅ Yes' : '❌ No (needs setup)'}`);
    
    if (!isAuthorized) {
      console.log("\n⚠️ IMPORTANT: The SearchPayment contract is not yet authorized to spend PSP tokens.");
      console.log("You need to call pspToken.setAuthorizedSpender() to enable payments.");
      console.log(`Run: pspToken.setAuthorizedSpender("${contractAddress}", true)`);
    }
  } catch (error) {
    console.log("⚠️ Could not verify PSP token integration:", error.message);
  }

  console.log("\n📝 Next Steps:");
  console.log("1. Add the contract address to your .env file:");
  console.log(`   VITE_SEARCH_PAYMENT_ADDRESS=${contractAddress}`);
  console.log("2. Authorize the SearchPayment contract to spend PSP tokens:");
  console.log(`   pspToken.setAuthorizedSpender("${contractAddress}", true)`);
  console.log("3. Test the complete payment flow on testnet");
  console.log("4. Verify both contracts on Etherscan");

  // Save deployment info to file
  const deploymentInfo = {
    network: networkName,
    contractAddress: contractAddress,
    pspTokenAddress: pspTokenAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    searchPriceInPSP: searchPriceInPSP.toString(),
    searchPriceInUSD: "5.00",
    searchesPerPayment: 1,
    transactionHash: searchPayment.deploymentTransaction()?.hash
  };

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }

  fs.writeFileSync(
    `deployments/SearchPayment_${networkName}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n💾 Deployment info saved to: deployments/SearchPayment_${networkName}.json`);

  // Create a combined deployment summary
  const combinedDeployment = {
    network: networkName,
    deploymentTime: new Date().toISOString(),
    contracts: {
      PSPToken: {
        address: pspTokenAddress,
        name: "Patent Search Pennies",
        symbol: "PSP",
        decimals: 18
      },
      SearchPayment: {
        address: contractAddress,
        searchPrice: "500 PSP",
        searchPriceUSD: "$5.00"
      }
    },
    environmentVariables: {
      VITE_PSP_TOKEN_ADDRESS: pspTokenAddress,
      VITE_SEARCH_PAYMENT_ADDRESS: contractAddress
    }
  };

  fs.writeFileSync(
    `deployments/Complete_${networkName}.json`,
    JSON.stringify(combinedDeployment, null, 2)
  );

  console.log(`\n📦 Complete deployment summary saved to: deployments/Complete_${networkName}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
