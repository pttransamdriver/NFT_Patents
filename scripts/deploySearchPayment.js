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

  // Get network info for USDC address
  const network = await ethers.provider.getNetwork();
  let usdcTokenAddress;

  if (network.chainId === 31337n) { // localhost
    // For localhost, we'll use a placeholder USDC address
    usdcTokenAddress = "0x0000000000000000000000000000000000000001";
    console.log("⚠️  Using placeholder USDC address for localhost testing");
  } else if (network.chainId === 11155111n) { // Sepolia
    usdcTokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC on Sepolia
  } else if (network.chainId === 1n) { // Mainnet
    usdcTokenAddress = "0xA0b86a33E6441b8C4505B7C0c6b0b8e6C6C6C6C6"; // USDC on Mainnet
  } else {
    throw new Error(`Unsupported network: ${network.chainId}`);
  }

  // Get the contract factory
  const SearchPayment = await ethers.getContractFactory("SearchPayment");

  // Set search prices equivalent to $5.00 USD:
  const searchPriceInETH = ethers.parseEther("0.002"); // ~$5 at $2500/ETH
  const searchPriceInUSDC = ethers.parseUnits("5", 6); // $5 USDC (6 decimals)
  const searchPriceInPSP = ethers.parseUnits("500", 18); // 500 PSP tokens

  console.log("🎯 Multi-Token Search Pricing:");
  console.log(`   ETH: ${ethers.formatEther(searchPriceInETH)} ETH (~$5.00)`);
  console.log(`   USDC: ${ethers.formatUnits(searchPriceInUSDC, 6)} USDC`);
  console.log(`   PSP: ${ethers.formatUnits(searchPriceInPSP, 18)} PSP tokens`);

  // Deploy the enhanced contract with multi-token support
  const searchPayment = await SearchPayment.deploy(
    pspTokenAddress,
    usdcTokenAddress,
    searchPriceInETH,
    searchPriceInUSDC,
    searchPriceInPSP
  );
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
  console.log(`💵 USDC Token Address: ${usdcTokenAddress}`);

  // Verify contract details
  try {
    const [pspAddress, usdcAddress] = await searchPayment.getTokenAddresses();
    const [ethPrice, usdcPrice, pspPrice] = await searchPayment.getAllSearchPrices();
    const searchesPerPayment = await searchPayment.getSearchesPerPayment();

    console.log("\n🔍 Contract Verification:");
    console.log(`✅ PSP Token: ${pspAddress}`);
    console.log(`✅ USDC Token: ${usdcAddress}`);
    console.log(`✅ ETH Price: ${ethers.formatEther(ethPrice)} ETH`);
    console.log(`✅ USDC Price: ${ethers.formatUnits(usdcPrice, 6)} USDC`);
    console.log(`✅ PSP Price: ${ethers.formatUnits(pspPrice, 18)} PSP`);
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
  console.log("3. Test all payment methods (ETH, USDC, PSP)");
  console.log("4. Verify contracts on Etherscan");
  console.log("\n💰 Payment Methods Available:");
  console.log("   - payWithETH(): Direct Ethereum payments");
  console.log("   - payWithUSDC(): Stablecoin payments");
  console.log("   - payWithPSP(): Native platform tokens");

  // Save deployment info to file
  const deploymentInfo = {
    network: networkName,
    contractAddress: contractAddress,
    pspTokenAddress: pspTokenAddress,
    usdcTokenAddress: usdcTokenAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    pricing: {
      ethPrice: searchPriceInETH.toString(),
      usdcPrice: searchPriceInUSDC.toString(),
      pspPrice: searchPriceInPSP.toString(),
      equivalentUSD: "5.00"
    },
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
        supportedTokens: ["ETH", "USDC", "PSP"],
        pricing: {
          eth: "0.002 ETH",
          usdc: "5 USDC",
          psp: "500 PSP",
          equivalentUSD: "$5.00"
        }
      }
    },
    environmentVariables: {
      VITE_PSP_TOKEN_ADDRESS: pspTokenAddress,
      VITE_SEARCH_PAYMENT_ADDRESS: contractAddress,
      VITE_USDC_TOKEN_ADDRESS: usdcTokenAddress
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
