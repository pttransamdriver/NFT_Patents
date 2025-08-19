import { ethers } from "ethers";
import hre from "hardhat";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting Sepolia Deployment with Hardhat v3...");
  
  // Get network configuration
  const network = hre.network;
  console.log("🌐 Network:", network.name);
  
  if (network.name !== "sepolia") {
    console.log("⚠️  This script is designed for Sepolia. Current network:", network.name);
    console.log("💡 To deploy to Sepolia, run: npx hardhat run scripts/deploy-sepolia-v3.js --network sepolia");
    return;
  }
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(network.config.url);
  const wallet = new ethers.Wallet(network.config.accounts[0], provider);
  
  console.log("👤 Deploying with account:", wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.05")) {
    console.log("⚠️  Warning: Low balance. You may need more ETH for deployment.");
    console.log("💡 Get Sepolia ETH from: https://sepoliafaucet.com/");
    return;
  }
  
  const deploymentInfo = {
    network: "sepolia",
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  try {
    // Get contract artifacts
    const PSPTokenArtifact = await hre.artifacts.readArtifact("PSPToken");
    const SearchPaymentArtifact = await hre.artifacts.readArtifact("SearchPayment");
    const PatentNFTArtifact = await hre.artifacts.readArtifact("PatentNFT");
    
    // 1. Deploy PSP Token
    console.log("\\n📦 Deploying PSP Token...");
    const PSPTokenFactory = new ethers.ContractFactory(PSPTokenArtifact.abi, PSPTokenArtifact.bytecode, wallet);
    const pspToken = await PSPTokenFactory.deploy();
    await pspToken.waitForDeployment();
    
    const pspAddress = await pspToken.getAddress();
    console.log("✅ PSP Token deployed to:", pspAddress);
    
    deploymentInfo.contracts.PSPToken = {
      address: pspAddress,
      name: "Patent Search Pennies",
      symbol: "PSP"
    };

    // 2. Deploy Search Payment Contract
    console.log("\\n📦 Deploying SearchPayment Contract...");
    const sepoliaUSDCAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC
    
    const SearchPaymentFactory = new ethers.ContractFactory(SearchPaymentArtifact.abi, SearchPaymentArtifact.bytecode, wallet);
    const searchPayment = await SearchPaymentFactory.deploy(pspAddress, sepoliaUSDCAddress);
    await searchPayment.waitForDeployment();
    
    const searchPaymentAddress = await searchPayment.getAddress();
    console.log("✅ SearchPayment deployed to:", searchPaymentAddress);
    
    deploymentInfo.contracts.SearchPayment = {
      address: searchPaymentAddress,
      pspToken: pspAddress,
      usdcToken: sepoliaUSDCAddress
    };

    // 3. Deploy Patent NFT Contract
    console.log("\\n📦 Deploying PatentNFT Contract...");
    const PatentNFTFactory = new ethers.ContractFactory(PatentNFTArtifact.abi, PatentNFTArtifact.bytecode, wallet);
    const patentNFT = await PatentNFTFactory.deploy();
    await patentNFT.waitForDeployment();
    
    const patentNFTAddress = await patentNFT.getAddress();
    console.log("✅ PatentNFT deployed to:", patentNFTAddress);
    
    deploymentInfo.contracts.PatentNFT = {
      address: patentNFTAddress,
      name: "Patent NFT",
      symbol: "PNFT"
    };

    // 4. Set up PSP Token authorization
    console.log("\\n🔐 Setting up PSP Token authorization...");
    const authTx = await pspToken.setAuthorizedSpender(searchPaymentAddress, true);
    await authTx.wait();
    console.log("✅ SearchPayment authorized to spend PSP tokens");

    // 5. Save deployment information
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, 'sepolia_deployment.json');
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    // 6. Create environment variables file
    const envContent = `# Sepolia Deployment - ${new Date().toISOString()}
VITE_NETWORK_NAME=sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/\${INFURA_PROJECT_ID}

# Contract Addresses
VITE_PSP_TOKEN_ADDRESS=${pspAddress}
VITE_SEARCH_PAYMENT_ADDRESS=${searchPaymentAddress}
VITE_PATENT_NFT_ADDRESS=${patentNFTAddress}
VITE_USDC_TOKEN_ADDRESS=${sepoliaUSDCAddress}

# API Configuration
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_ENVIRONMENT=testnet
VITE_DEBUG=false
`;

    const envFile = path.join(__dirname, '..', '.env.sepolia');
    fs.writeFileSync(envFile, envContent);

    // 7. Display summary
    console.log("\\n🎉 Deployment Complete!");
    console.log("=".repeat(50));
    console.log("📋 Deployment Summary:");
    console.log("👤 Deployer:", wallet.address);
    console.log("🌐 Network: Sepolia Testnet");
    console.log("🪙 PSP Token:", pspAddress);
    console.log("💳 SearchPayment:", searchPaymentAddress);
    console.log("🖼️  PatentNFT:", patentNFTAddress);
    console.log("💵 USDC Token:", sepoliaUSDCAddress);
    
    console.log("\\n📝 Next Steps:");
    console.log("1. Copy .env.sepolia to .env (or update your existing .env)");
    console.log("2. Verify contracts on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${pspAddress}`);
    console.log(`   npx hardhat verify --network sepolia ${searchPaymentAddress} ${pspAddress} ${sepoliaUSDCAddress}`);
    console.log(`   npx hardhat verify --network sepolia ${patentNFTAddress}`);
    console.log("3. Test the application with MetaMask on Sepolia");
    console.log("4. Update your frontend and backend configurations");
    
    console.log("\\n🔗 Useful Links:");
    console.log(`📊 PSP Token: https://sepolia.etherscan.io/address/${pspAddress}`);
    console.log(`💳 SearchPayment: https://sepolia.etherscan.io/address/${searchPaymentAddress}`);
    console.log(`🖼️  PatentNFT: https://sepolia.etherscan.io/address/${patentNFTAddress}`);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });