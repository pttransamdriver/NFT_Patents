import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log("🚀 Starting complete deployment...");
  
  // For localhost deployment, use Hardhat's default provider
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Get current nonce
  let nonce = await provider.getTransactionCount(wallet.address);
    
  console.log("📋 Deployment Summary:");
  console.log("👤 Deployer:", wallet.address);
  console.log("🌐 Network:", hre.network.name);
  
  const deployedContracts = {};
  
  // 1. Deploy PSP Token first (1 PSP = $0.01, so ~0.000004 ETH at $2500/ETH)
  console.log("\n📦 Deploying PSP Token...");
  const PSPTokenArtifact = await hre.artifacts.readArtifact("PSPToken");
  const PSPTokenFactory = new ethers.ContractFactory(PSPTokenArtifact.abi, PSPTokenArtifact.bytecode, wallet);
  const initialTokenPrice = ethers.parseEther("0.000004"); // 1 PSP = ~$0.01
  const pspToken = await PSPTokenFactory.deploy(initialTokenPrice, { nonce: nonce++ });
  await pspToken.waitForDeployment();
  const pspTokenAddress = await pspToken.getAddress();
  deployedContracts.PSPToken = pspTokenAddress;
  console.log("✅ PSP Token deployed to:", pspTokenAddress);
  
  // 2. Deploy SearchPayment contract
  console.log("\n📦 Deploying SearchPayment contract...");
  const SearchPaymentArtifact = await hre.artifacts.readArtifact("SearchPayment");
  const SearchPaymentFactory = new ethers.ContractFactory(SearchPaymentArtifact.abi, SearchPaymentArtifact.bytecode, wallet);
  
  // Constructor parameters for SearchPayment
  const usdcTokenAddress = "0x0000000000000000000000000000000000000001"; // Mock USDC for testing
  const initialPriceInETH = ethers.parseEther("0.002"); // $5 at $2500/ETH
  const initialPriceInUSDC = ethers.parseUnits("5", 6); // $5 USDC (6 decimals)
  const initialPriceInPSP = ethers.parseEther("500"); // 500 PSP tokens
  
  const searchPayment = await SearchPaymentFactory.deploy(
    pspTokenAddress,
    usdcTokenAddress, 
    initialPriceInETH,
    initialPriceInUSDC,
    initialPriceInPSP,
    { nonce: nonce++ }
  );
  await searchPayment.waitForDeployment();
  const searchPaymentAddress = await searchPayment.getAddress();
  deployedContracts.SearchPayment = searchPaymentAddress;
  console.log("✅ SearchPayment deployed to:", searchPaymentAddress);
  
  // 3. Deploy PatentNFT contract
  console.log("\n📦 Deploying PatentNFT contract...");
  const PatentNFTArtifact = await hre.artifacts.readArtifact("PatentNFT");
  const PatentNFTFactory = new ethers.ContractFactory(PatentNFTArtifact.abi, PatentNFTArtifact.bytecode, wallet);
  const patentNFT = await PatentNFTFactory.deploy({ nonce: nonce++ });
  await patentNFT.waitForDeployment();
  const patentNFTAddress = await patentNFT.getAddress();
  deployedContracts.PatentNFT = patentNFTAddress;
  console.log("✅ PatentNFT deployed to:", patentNFTAddress);
    
  // Update .env file with all contract addresses
  const envPath = join(__dirname, "../.env");
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }
  
  // Remove existing contract addresses
  envContent = envContent.replace(/^VITE_PATENT_NFT_ADDRESS=.*$/m, "");
  envContent = envContent.replace(/^VITE_PSP_TOKEN_ADDRESS=.*$/m, "");
  envContent = envContent.replace(/^VITE_SEARCH_PAYMENT_ADDRESS=.*$/m, "");
  
  // Add new addresses
  envContent += `\nVITE_PATENT_NFT_ADDRESS=${patentNFTAddress}\n`;
  envContent += `VITE_PSP_TOKEN_ADDRESS=${pspTokenAddress}\n`;
  envContent += `VITE_SEARCH_PAYMENT_ADDRESS=${searchPaymentAddress}\n`;
  
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("💾 All contract addresses saved to .env");
    
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployerAddress: wallet.address,
    deploymentTime: new Date().toISOString(),
    contracts: {
      PSPToken: {
        address: pspTokenAddress,
        name: "Patent Search Pennies",
        symbol: "PSP"
      },
      SearchPayment: {
        address: searchPaymentAddress,
        name: "SearchPayment",
        pspTokenAddress: pspTokenAddress
      },
      PatentNFT: {
        address: patentNFTAddress,
        name: "PatentNFT",
        symbol: "PNFT"
      }
    }
  };
  
  const deploymentsDir = join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    join(deploymentsDir, `Complete_${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n🎉 Complete deployment successful!");
  console.log("📝 Contract Summary:");
  console.log(`💰 PSP Token: ${pspTokenAddress}`);
  console.log(`🔍 SearchPayment: ${searchPaymentAddress}`);
  console.log(`🎨 PatentNFT: ${patentNFTAddress}`);
  console.log("\n📝 Next steps:");
  console.log("1. All contracts are deployed and ready");
  console.log("2. Go to /mint to create your first Patent NFT");
  console.log("3. PSP tokens ready for future payment integration");
    

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });