// We import the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
import { ethers } from "hardhat";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Deploy PatentNFT contract
  const PatentNFT = await ethers.getContractFactory("PatentNFT");
  const patentNFT = await PatentNFT.deploy();
  await patentNFT.waitForDeployment();
  const patentNFTAddress = await patentNFT.getAddress();
  console.log("PatentNFT deployed to:", patentNFTAddress);
  
  // Save the contract address to a file for the frontend to use
  const contractsDir = join(__dirname, "../src/contracts");
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    join(contractsDir, "contract-address.json"),
    JSON.stringify({ PatentNFT: patentNFTAddress }, undefined, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });