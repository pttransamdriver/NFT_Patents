const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying NFT Marketplace with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy NFTMarketplace
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(deployer.address); // Fee recipient is deployer
  
  await marketplace.deployed();
  
  console.log("NFTMarketplace deployed to:", marketplace.address);
  console.log("Fee recipient:", deployer.address);
  console.log("Platform fee:", await marketplace.platformFeePercent(), "basis points (2.5%)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });