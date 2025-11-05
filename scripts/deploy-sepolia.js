import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log("🚀 Starting Sepolia deployment...");
  
  // Verify we're on Sepolia
  if (hre.network.name !== 'sepolia') {
    throw new Error('This script should only be run on the Sepolia network');
  }

  const [deployer] = await hre.ethers.getSigners();
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log("📋 Sepolia Deployment Summary:");
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(deployerBalance), "ETH");
  console.log("🌐 Network:", hre.network.name);
  console.log("🔗 Chain ID:", hre.network.config.chainId);

  if (deployerBalance < ethers.parseEther("0.1")) {
    console.warn("⚠️  Warning: Low balance. You may need more Sepolia ETH from faucet.");
  }

  const deployedContracts = {};
  
  // 1. Deploy PSP Token
  console.log("\n📦 Deploying PSP Token...");
  const PSPToken = await hre.ethers.getContractFactory("PSPToken");
  const initialTokenPrice = ethers.parseEther("0.000004"); // 1 PSP = ~$0.01
  const pspToken = await PSPToken.deploy(initialTokenPrice);
  await pspToken.waitForDeployment();
  const pspTokenAddress = await pspToken.getAddress();
  deployedContracts.PSPToken = pspTokenAddress;
  console.log("✅ PSP Token deployed to:", pspTokenAddress);
  
  // 2. Deploy SearchPayment contract
  console.log("\n📦 Deploying SearchPayment contract...");
  const SearchPayment = await hre.ethers.getContractFactory("SearchPayment");
  const usdcTokenAddress = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"; // Sepolia USDC
  const initialPriceInETH = ethers.parseEther("0.002"); // $5 at $2500/ETH
  const initialPriceInUSDC = ethers.parseUnits("5", 6); // $5 USDC
  const initialPriceInPSP = ethers.parseEther("500"); // 500 PSP tokens
  
  const searchPayment = await SearchPayment.deploy(
    pspTokenAddress,
    usdcTokenAddress,
    initialPriceInETH,
    initialPriceInUSDC,
    initialPriceInPSP
  );
  await searchPayment.waitForDeployment();
  const searchPaymentAddress = await searchPayment.getAddress();
  deployedContracts.SearchPayment = searchPaymentAddress;
  console.log("✅ SearchPayment deployed to:", searchPaymentAddress);
  
  // 3. Deploy PatentNFT contract
  console.log("\n📦 Deploying PatentNFT contract...");
  const PatentNFT = await hre.ethers.getContractFactory("PatentNFT");

  // Constructor arguments for PatentNFT
  const royaltyReceiver = deployer.address; // Deployer receives royalties
  const royaltyFeeNumerator = 500; // 5% royalty fee (500 basis points)
  // Use production backend URL from environment or default to Vercel backend
  const baseMetadataURI = process.env.VITE_API_BASE_URL
    ? `${process.env.VITE_API_BASE_URL}/api/metadata/`
    : "https://nft-patents-backend.vercel.app/api/metadata/";

  console.log(`   👑 Royalty Receiver: ${royaltyReceiver}`);
  console.log(`   💎 Royalty Fee: ${royaltyFeeNumerator / 100}%`);
  console.log(`   🔗 Base Metadata URI: ${baseMetadataURI}`);

  const patentNFT = await PatentNFT.deploy(royaltyReceiver, royaltyFeeNumerator, baseMetadataURI);
  await patentNFT.waitForDeployment();
  const patentNFTAddress = await patentNFT.getAddress();
  deployedContracts.PatentNFT = patentNFTAddress;
  console.log("✅ PatentNFT deployed to:", patentNFTAddress);
  
  // 4. Deploy NFTMarketplace contract
  console.log("\n📦 Deploying NFTMarketplace contract...");
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const feeRecipient = deployer.address; // Platform fee recipient
  const marketplace = await NFTMarketplace.deploy(feeRecipient);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  deployedContracts.NFTMarketplace = marketplaceAddress;
  console.log("✅ NFTMarketplace deployed to:", marketplaceAddress);

  // 5. Configure contracts
  console.log("\n⚙️  Configuring contracts...");

  // Set PSP token as authorized spender in SearchPayment
  await searchPayment.setPSPToken(pspTokenAddress);
  console.log("✅ PSP token authorized in SearchPayment");

  // Note: PatentNFT metadata URI is set via constructor
  console.log("✅ PatentNFT metadata URI configured via constructor");

  // 6. Save deployment information
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    deploymentTime: new Date().toISOString(),
    deployerAddress: deployer.address,
    gasUsed: "Calculated during deployment",
    contracts: {
      PatentNFT: {
        address: patentNFTAddress,
        mintingPrice: "0.05 ETH",
        royaltyReceiver: royaltyReceiver,
        royaltyFeeNumerator: royaltyFeeNumerator,
        baseMetadataURI: baseMetadataURI
      },
      PSPToken: {
        address: pspTokenAddress,
        name: "Patent Search Pennies",
        symbol: "PSP",
        decimals: 18,
        initialPrice: ethers.formatEther(initialTokenPrice) + " ETH per PSP"
      },
      SearchPayment: {
        address: searchPaymentAddress,
        supportedTokens: ["ETH", "USDC", "PSP"],
        pricing: {
          eth: "0.002 ETH",
          usdc: "5 USDC", 
          psp: "500 PSP",
          equivalentUSD: "$5.00"
        }
      },
      NFTMarketplace: {
        address: marketplaceAddress,
        feeRecipient: feeRecipient,
        platformFee: "2.5%"
      }
    },
    environmentVariables: {
      VITE_PATENT_NFT_ADDRESS: patentNFTAddress,
      VITE_PSP_TOKEN_ADDRESS: pspTokenAddress,
      VITE_SEARCH_PAYMENT_ADDRESS: searchPaymentAddress,
      VITE_MARKETPLACE_ADDRESS: marketplaceAddress,
      VITE_CHAIN_ID: "11155111",
      VITE_NETWORK_NAME: "sepolia"
    },
    verificationCommands: {
      PatentNFT: `npx hardhat verify --network sepolia ${patentNFTAddress} "${royaltyReceiver}" ${royaltyFeeNumerator} "${baseMetadataURI}"`,
      PSPToken: `npx hardhat verify --network sepolia ${pspTokenAddress} ${initialTokenPrice}`,
      SearchPayment: `npx hardhat verify --network sepolia ${searchPaymentAddress} ${pspTokenAddress} ${usdcTokenAddress} ${initialPriceInETH} ${initialPriceInUSDC} ${initialPriceInPSP}`,
      NFTMarketplace: `npx hardhat verify --network sepolia ${marketplaceAddress} ${feeRecipient}`
    }
  };

  // Save to file
  const outputPath = join(__dirname, '../deployments/Sepolia_deployment.json');
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${outputPath}`);

  // Print environment variables
  console.log("\n📝 Update your .env file with these values:");
  console.log("VITE_PATENT_NFT_ADDRESS=" + patentNFTAddress);
  console.log("VITE_PSP_TOKEN_ADDRESS=" + pspTokenAddress);
  console.log("VITE_SEARCH_PAYMENT_ADDRESS=" + searchPaymentAddress);
  console.log("VITE_MARKETPLACE_ADDRESS=" + marketplaceAddress);
  console.log("VITE_CHAIN_ID=11155111");
  console.log("VITE_NETWORK_NAME=sepolia");

  console.log("\n🔍 Verify contracts on Etherscan:");
  Object.entries(deploymentInfo.verificationCommands).forEach(([name, command]) => {
    console.log(`${name}: ${command}`);
  });

  console.log("\n🎉 Sepolia deployment completed successfully!");
  console.log("⚠️  Remember to:");
  console.log("1. Update your .env file with the new contract addresses");
  console.log("2. Update the backend metadata URI in your production environment");
  console.log("3. Fund your contracts if needed (PSP tokens, etc.)");
  console.log("4. Verify contracts on Etherscan");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });