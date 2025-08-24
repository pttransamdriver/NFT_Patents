import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Debugging NFT Minting Process...\n");

  const contractAddress = process.env.VITE_PATENT_NFT_ADDRESS || "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  console.log("📄 Contract Address:", contractAddress);
  
  // Get accounts
  const [deployer, user1] = await ethers.getSigners();
  console.log("👤 User1 account:", user1.address);
  console.log("💰 User1 balance:", ethers.formatEther(await ethers.provider.getBalance(user1.address)), "ETH");

  try {
    // Get contract instance
    const PatentNFT = await ethers.getContractAt("PatentNFT", contractAddress);
    
    console.log("\n🔍 Contract State:");
    const totalSupply = await PatentNFT.totalSupply();
    console.log("📊 Total NFTs minted:", totalSupply.toString());
    
    const mintingPrice = await PatentNFT.getMintingPrice();
    console.log("💰 Minting price:", ethers.formatEther(mintingPrice), "ETH");
    
    // Check user's NFT balance
    const userBalance = await PatentNFT.balanceOf(user1.address);
    console.log("🎨 User's NFT balance:", userBalance.toString());

    // Test minting a new NFT
    console.log("\n🚀 Testing minting process...");
    const patentNumber = `US${Math.floor(Math.random() * 1000000)}B2`;
    console.log("📄 Patent Number:", patentNumber);
    
    // Check if patent exists
    const exists = await PatentNFT.patentExists(patentNumber);
    console.log("❓ Patent exists:", exists);
    
    if (!exists) {
      console.log("💸 Attempting to mint...");
      const tx = await PatentNFT.connect(user1).mintPatentNFT(user1.address, patentNumber, {
        value: mintingPrice,
        gasLimit: 500000
      });
      
      console.log("📄 Transaction hash:", tx.hash);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
      console.log("⛽ Gas used:", receipt.gasUsed.toString());
      
      // Check logs for events
      console.log("📝 Transaction logs:", receipt.logs.length);
      for (let i = 0; i < receipt.logs.length; i++) {
        try {
          const parsedLog = PatentNFT.interface.parseLog(receipt.logs[i]);
          if (parsedLog.name === 'PatentMinted') {
            console.log("🎉 PatentMinted event found!");
            console.log("   Token ID:", parsedLog.args[0].toString());
            console.log("   Owner:", parsedLog.args[1]);
            console.log("   Patent Number:", parsedLog.args[2]);
          }
        } catch (e) {
          // Not a PatentNFT event
        }
      }
      
      // Check final state
      const finalSupply = await PatentNFT.totalSupply();
      const finalUserBalance = await PatentNFT.balanceOf(user1.address);
      console.log("📊 Final total supply:", finalSupply.toString());
      console.log("🎨 Final user balance:", finalUserBalance.toString());
      
      // If user has NFTs, get their details
      if (finalUserBalance > 0) {
        console.log("\n🔍 User's NFTs:");
        for (let i = 0; i < finalUserBalance; i++) {
          try {
            const tokenId = await PatentNFT.tokenOfOwnerByIndex(user1.address, i);
            console.log(`   NFT ${i + 1}: Token ID ${tokenId.toString()}`);
            
            // Get patent details
            try {
              const patent = await PatentNFT.getPatent(tokenId);
              console.log(`     Title: ${patent.title}`);
              console.log(`     Inventor: ${patent.inventor}`);
              console.log(`     Patent Number: ${patent.patentNumber}`);
              console.log(`     Verified: ${patent.isVerified}`);
            } catch (e) {
              console.log(`     Could not get patent details: ${e.message}`);
            }
            
            // Get token URI
            try {
              const tokenURI = await PatentNFT.tokenURI(tokenId);
              console.log(`     Token URI: ${tokenURI}`);
            } catch (e) {
              console.log(`     Could not get token URI: ${e.message}`);
            }
          } catch (e) {
            console.log(`   Error getting NFT ${i}: ${e.message}`);
          }
        }
      }
    } else {
      console.log("⚠️ Patent already exists, trying different number...");
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Solution: Make sure you have enough ETH in your account");
    }
    
    if (error.message.includes("revert")) {
      console.log("💡 Contract reverted - check contract requirements");
    }
  }
}

main()
  .then(() => {
    console.log("\n✅ Debug complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Debug failed:", error);
    process.exit(1);
  });