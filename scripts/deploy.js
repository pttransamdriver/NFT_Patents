import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Get the contract artifact and create factory
  const PatentNFTArtifact = await hre.artifacts.readArtifact("PatentNFT");
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  // Use the first default Hardhat account private key
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Create contract factory and deploy
  const PatentNFTFactory = new ethers.ContractFactory(PatentNFTArtifact.abi, PatentNFTArtifact.bytecode, wallet);
  const patentNFT = await PatentNFTFactory.deploy();
  await patentNFT.waitForDeployment();
  const patentNFTAddress = await patentNFT.getAddress();
  console.log("PatentNFT deployed to:", patentNFTAddress);
  
  // Update .env file with contract address
  const envPath = join(__dirname, "../.env");
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }
  
  // Remove existing PatentNFT address if present
  envContent = envContent.replace(/^VITE_PATENT_NFT_ADDRESS=.*$/m, "");
  
  // Add new address
  envContent += `\nVITE_PATENT_NFT_ADDRESS=${patentNFTAddress}\n`;
  
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("Contract address saved to .env");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });