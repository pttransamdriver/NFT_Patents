import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing Patent NFT Minting...\n");

  // Get contract address from environment
  const contractAddress = process.env.VITE_PATENT_NFT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  
  // Get accounts
  const [deployer, user1] = await ethers.getSigners();
  console.log("📝 Deployer account:", deployer.address);
  console.log("👤 User1 account:", user1.address);
  
  // Get contract instance
  const PatentNFT = await ethers.getContractAt("PatentNFT", contractAddress);
  
  // Check initial state
  console.log("\n🔍 Initial Contract State:");
  const mintingPrice = await PatentNFT.getMintingPrice();
  console.log("💰 Minting price:", ethers.formatEther(mintingPrice), "ETH");
  
  const totalSupply = await PatentNFT.totalSupply();
  console.log("📊 Total NFTs minted:", totalSupply.toString());

  // Check user1 balance before
  const balanceBefore = await ethers.provider.getBalance(user1.address);
  console.log("💎 User1 ETH balance before:", ethers.formatEther(balanceBefore));

  // Test minting
  console.log("\n🚀 Attempting to mint patent NFT...");
  const patentNumber = "US10123456B2";
  
  try {
    // Check if patent already exists
    const exists = await PatentNFT.patentExists(patentNumber);
    console.log("🔍 Patent exists:", exists);
    
    if (exists) {
      console.log("⚠️  Patent already minted, trying different number...");
      const newPatentNumber = `US${Math.floor(Math.random() * 10000000)}B2`;
      console.log("🆕 Using patent number:", newPatentNumber);
      
      const tx = await PatentNFT.connect(user1).mintPatentNFT(user1.address, newPatentNumber, {
        value: mintingPrice
      });
      
      console.log("📄 Transaction hash:", tx.hash);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed!");
      console.log("⛽ Gas used:", receipt.gasUsed.toString());
      
      // Find the PatentMinted event
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = PatentNFT.interface.parseLog(log);
          return parsedLog.name === 'PatentMinted';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedEvent = PatentNFT.interface.parseLog(event);
        console.log("🎉 NFT minted successfully!");
        console.log("🔖 Token ID:", parsedEvent.args[0].toString());
        console.log("👤 Owner:", parsedEvent.args[1]);
        console.log("📄 Patent Number:", parsedEvent.args[2]);
      }
    } else {
      const tx = await PatentNFT.connect(user1).mintPatentNFT(user1.address, patentNumber, {
        value: mintingPrice
      });
      
      console.log("📄 Transaction hash:", tx.hash);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed!");
      console.log("⛽ Gas used:", receipt.gasUsed.toString());
      
      // Find the PatentMinted event
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = PatentNFT.interface.parseLog(log);
          return parsedLog.name === 'PatentMinted';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedEvent = PatentNFT.interface.parseLog(event);
        console.log("🎉 NFT minted successfully!");
        console.log("🔖 Token ID:", parsedEvent.args[0].toString());
        console.log("👤 Owner:", parsedEvent.args[1]);
        console.log("📄 Patent Number:", parsedEvent.args[2]);
      }
    }
    
    // Check final state
    console.log("\n📊 Final Contract State:");
    const finalSupply = await PatentNFT.totalSupply();
    console.log("📈 Total NFTs minted:", finalSupply.toString());
    
    const balanceAfter = await ethers.provider.getBalance(user1.address);
    console.log("💎 User1 ETH balance after:", ethers.formatEther(balanceAfter));
    
    const spent = balanceBefore - balanceAfter;
    console.log("💸 ETH spent (including gas):", ethers.formatEther(spent));
    
  } catch (error) {
    console.error("❌ Minting failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution: Make sure the user account has enough ETH");
      console.log("   - Import Hardhat account to MetaMask");
      console.log("   - Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    }
    
    if (error.message.includes("Patent already minted")) {
      console.log("\n💡 This is normal - patent was already minted");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });