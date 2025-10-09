import { expect } from "chai";
import { ethers } from "hardhat";

describe("Integration Tests", function () {
  let patentNFT, pspToken, searchPayment, marketplace;
  let owner, user1, user2, royaltyReceiver, feeRecipient;
  
  const ROYALTY_FEE = 500; // 5%
  const PLATFORM_FEE = 250; // 2.5%
  const PSP_TOKEN_PRICE = ethers.parseEther("0.00002"); // $0.01 worth of ETH
  const SEARCH_PRICE_PSP = ethers.parseEther("500"); // 500 PSP tokens for search
  const NFT_PRICE = ethers.parseEther("1.0");
  
  const TEST_PATENT_1 = "US1234567";
  const TEST_PATENT_2 = "US7654321";
  const TEST_URI_1 = "ipfs://QmTest1";
  const TEST_URI_2 = "ipfs://QmTest2";
  
  beforeEach(async function () {
    [owner, user1, user2, royaltyReceiver, feeRecipient] = await ethers.getSigners();
    
    // Deploy contracts in dependency order
    
    // 1. Deploy PSP Token
    const PSPToken = await ethers.getContractFactory("PSPToken");
    pspToken = await PSPToken.deploy(PSP_TOKEN_PRICE);
    await pspToken.waitForDeployment();
    
    // 2. Deploy SearchPayment (requires PSP token)
    const SearchPayment = await ethers.getContractFactory("SearchPayment");
    searchPayment = await SearchPayment.deploy(
      await pspToken.getAddress(),
      await pspToken.getAddress(), // Using PSP as mock USDC
      ethers.parseEther("0.002"),
      5000000,
      SEARCH_PRICE_PSP
    );
    await searchPayment.waitForDeployment();
    
    // 3. Deploy PatentNFT
    const PatentNFT = await ethers.getContractFactory("PatentNFT");
    patentNFT = await PatentNFT.deploy(royaltyReceiver.address, ROYALTY_FEE);
    await patentNFT.waitForDeployment();
    
    // 4. Deploy Marketplace (requires PatentNFT)
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await NFTMarketplace.deploy(feeRecipient.address);
    await marketplace.waitForDeployment();
    
    // Setup: Give users some PSP tokens and approve spending
    await pspToken.transfer(user1.address, ethers.parseEther("10000"));
    await pspToken.transfer(user2.address, ethers.parseEther("10000"));
    
    await pspToken.connect(user1).approve(await searchPayment.getAddress(), ethers.parseEther("10000"));
    await pspToken.connect(user2).approve(await searchPayment.getAddress(), ethers.parseEther("10000"));
  });

  describe("Full Patent NFT Lifecycle", function () {
    it("Should complete full lifecycle: mint → list → buy", async function () {
      // Step 1: User1 mints patent NFT with payment
      const mintingPrice = await patentNFT.getMintingPrice();
      await patentNFT.connect(user1).mintPatentNFT(user1.address, TEST_PATENT_1, { value: mintingPrice });
      expect(await patentNFT.ownerOf(1)).to.equal(user1.address);
      expect(await patentNFT.patentExists(TEST_PATENT_1)).to.be.true;
      
      // Step 2: User1 approves marketplace and lists NFT
      await patentNFT.connect(user1).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(user1).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE);
      
      // Verify listing
      const listing = await marketplace.listings(1);
      expect(listing.seller).to.equal(user1.address);
      expect(listing.price).to.equal(NFT_PRICE);
      expect(listing.active).to.be.true;
      
      // Step 3: User2 buys NFT
      await marketplace.connect(user2).buyNFT(1, { value: NFT_PRICE });
      
      // Verify ownership transfer
      expect(await patentNFT.ownerOf(1)).to.equal(user2.address);
      
      // Verify listing is no longer active
      const updatedListing = await marketplace.listings(1);
      expect(updatedListing.active).to.be.false;
      
      // Verify funds distribution
      const platformFee = (NFT_PRICE * BigInt(PLATFORM_FEE)) / BigInt(10000);
      const sellerAmount = NFT_PRICE - platformFee;
      
      expect(await marketplace.pendingWithdrawals(user1.address)).to.equal(sellerAmount);
      expect(await marketplace.pendingWithdrawals(feeRecipient.address)).to.equal(platformFee);
    });

    it("Should prevent duplicate patent minting", async function () {
      // Mint first patent
      const mintingPrice = await patentNFT.getMintingPrice();
      await patentNFT.connect(user1).mintPatentNFT(user1.address, TEST_PATENT_1, { value: mintingPrice });
      
      // Try to mint same patent again - should fail
      await expect(
        patentNFT.connect(user2).mintPatentNFT(user2.address, TEST_PATENT_1, { value: mintingPrice })
      ).to.be.revertedWith("Patent already minted");
      
      // Verify only one NFT exists
      expect(await patentNFT.totalSupply()).to.equal(1);
    });

    it("Should handle multiple patents and listings", async function () {
      // Mint multiple patents
      const mintingPrice = await patentNFT.getMintingPrice();
      await patentNFT.connect(user1).mintPatentNFT(user1.address, TEST_PATENT_1, { value: mintingPrice });
      await patentNFT.connect(user1).mintPatentNFT(user1.address, TEST_PATENT_2, { value: mintingPrice });
      
      // List both NFTs
      await patentNFT.connect(user1).approve(await marketplace.getAddress(), 1);
      await patentNFT.connect(user1).approve(await marketplace.getAddress(), 2);
      
      await marketplace.connect(user1).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE);
      await marketplace.connect(user1).listNFT(await patentNFT.getAddress(), 2, ethers.parseEther("2.0"));
      
      // Verify multiple active listings
      const activeListings = await marketplace.getAllActiveListings();
      expect(activeListings.length).to.equal(2);
      
      // Buy one NFT
      await marketplace.connect(user2).buyNFT(1, { value: NFT_PRICE });
      
      // Verify only one listing remains active
      const remainingListings = await marketplace.getAllActiveListings();
      expect(remainingListings.length).to.equal(1);
      expect(remainingListings[0].tokenId).to.equal(2);
    });
  });

  describe("Search Payment Integration", function () {
    it("Should allow users to pay for searches with PSP tokens", async function () {
      // User pays for search with PSP tokens
      const tx = await searchPayment.connect(user1).payWithPSP();
      
      await expect(tx)
        .to.emit(searchPayment, "PaymentReceived")
        .withArgs(user1.address, 2, SEARCH_PRICE_PSP, await getBlockTimestamp(), 1);
      
      // Verify user statistics
      expect(await searchPayment.userSearchesPurchased(user1.address)).to.equal(1);
      expect(await searchPayment.getUserTokenStats(user1.address, 2)).to.equal(SEARCH_PRICE_PSP);
      
      // Verify contract received tokens
      expect(await pspToken.balanceOf(await searchPayment.getAddress())).to.equal(SEARCH_PRICE_PSP);
    });

    it("Should allow users to purchase PSP tokens and then pay for searches", async function () {
      const ethAmount = ethers.parseEther("0.1");
      
      // User purchases PSP tokens with ETH
      await pspToken.connect(user1).purchaseTokens({ value: ethAmount });
      
      // Calculate expected PSP tokens
      const expectedTokens = (ethAmount * ethers.parseEther("1")) / PSP_TOKEN_PRICE;
      
      // User should have PSP tokens now
      const balance = await pspToken.balanceOf(user1.address);
      expect(balance).to.be.gte(expectedTokens); // Greater than or equal due to initial transfer
      
      // User approves and pays for search
      await pspToken.connect(user1).approve(await searchPayment.getAddress(), SEARCH_PRICE_PSP);
      await searchPayment.connect(user1).payWithPSP();
      
      expect(await searchPayment.userSearchesPurchased(user1.address)).to.equal(1);
    });

    it("Should allow multiple payment methods", async function () {
      // Pay with ETH
      await searchPayment.connect(user1).payWithETH({ value: ethers.parseEther("0.002") });
      
      // Pay with PSP
      await searchPayment.connect(user1).payWithPSP();
      
      // Verify total searches purchased
      expect(await searchPayment.userSearchesPurchased(user1.address)).to.equal(2);
      
      // Verify individual payment tracking
      expect(await searchPayment.getUserTokenStats(user1.address, 0)).to.equal(ethers.parseEther("0.002"));
      expect(await searchPayment.getUserTokenStats(user1.address, 2)).to.equal(SEARCH_PRICE_PSP);
    });
  });

  describe("Cross-Contract Interactions", function () {
    beforeEach(async function () {
      // Mint and list an NFT for testing
      const mintingPrice = await patentNFT.getMintingPrice();
      await patentNFT.connect(user1).mintPatentNFT(user1.address, TEST_PATENT_1, { value: mintingPrice });
      await patentNFT.connect(user1).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(user1).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE);
    });

    it("Should handle marketplace fee distribution and withdrawals", async function () {
      // User2 buys NFT
      await marketplace.connect(user2).buyNFT(1, { value: NFT_PRICE });
      
      // Calculate expected amounts
      const platformFee = (NFT_PRICE * BigInt(PLATFORM_FEE)) / BigInt(10000);
      const sellerAmount = NFT_PRICE - platformFee;
      
      // Check pending withdrawals
      expect(await marketplace.pendingWithdrawals(user1.address)).to.equal(sellerAmount);
      expect(await marketplace.pendingWithdrawals(feeRecipient.address)).to.equal(platformFee);
      
      // Test withdrawals
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const tx = await marketplace.connect(user1).withdrawFunds();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.equal(initialBalance + sellerAmount - gasUsed);
      
      // Fee recipient withdrawal
      await marketplace.connect(feeRecipient).withdrawFunds();
      expect(await marketplace.pendingWithdrawals(feeRecipient.address)).to.equal(0);
    });

    it("Should respect ERC2981 royalty standard", async function () {
      const salePrice = ethers.parseEther("10.0");
      const [recipient, royaltyAmount] = await patentNFT.royaltyInfo(1, salePrice);
      
      expect(recipient).to.equal(royaltyReceiver.address);
      expect(royaltyAmount).to.equal(salePrice * BigInt(ROYALTY_FEE) / BigInt(10000));
    });

    it("Should handle listing cancellation correctly", async function () {
      // Cancel listing
      await marketplace.connect(user1).cancelListing(1);
      
      const listing = await marketplace.listings(1);
      expect(listing.active).to.be.false;
      
      // Should not be able to buy cancelled listing
      await expect(
        marketplace.connect(user2).buyNFT(1, { value: NFT_PRICE })
      ).to.be.revertedWith("Listing not active");
      
      // NFT should still belong to original owner
      expect(await patentNFT.ownerOf(1)).to.equal(user1.address);
    });
  });

  describe("Owner Functions Integration", function () {
    it("Should allow coordinated contract management", async function () {
      // Update PSP token price
      const newTokenPrice = ethers.parseEther("0.00003");
      await pspToken.updateTokenPrice(newTokenPrice);
      expect(await pspToken.tokenPriceInWei()).to.equal(newTokenPrice);
      
      // Update search price
      const newSearchPrice = ethers.parseEther("600");
      await searchPayment.updateSearchPrice(2, newSearchPrice);
      expect(await searchPayment.getSearchPrice(2)).to.equal(newSearchPrice);
      
      // Update marketplace fee
      const newMarketplaceFee = 300; // 3%
      await marketplace.setPlatformFee(newMarketplaceFee);
      expect(await marketplace.platformFeePercent()).to.equal(newMarketplaceFee);
    });

    it("Should handle emergency situations", async function () {
      // Pause search payments
      await searchPayment.pause();
      expect(await searchPayment.paused()).to.be.true;
      
      // Should not be able to pay for searches when paused
      await expect(
        searchPayment.connect(user1).payWithPSP()
      ).to.be.revertedWithCustomError(searchPayment, "EnforcedPause");
      
      // Pause PSP token
      await pspToken.pause();
      
      // Should not be able to transfer tokens when paused
      await expect(
        pspToken.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(pspToken, "EnforcedPause");
      
      // Unpause contracts
      await searchPayment.unpause();
      await pspToken.unpause();
      
      // Should work again after unpausing
      await searchPayment.connect(user1).payWithPSP();
      expect(await searchPayment.userSearchesPurchased(user1.address)).to.equal(1);
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle complex patent normalization scenarios", async function () {
      const variations = [
        "US 123 456 7",
        "us-123-456-7",
        "US123456 7",
        "us123 4567"
      ];
      
      // Mint first variation
      const mintingPrice = await patentNFT.getMintingPrice();
      await patentNFT.connect(user1).mintPatentNFT(user1.address, variations[0], { value: mintingPrice });
      
      // All other variations should fail
      for (let i = 1; i < variations.length; i++) {
        await expect(
          patentNFT.connect(user2).mintPatentNFT(user2.address, variations[i], { value: mintingPrice })
        ).to.be.revertedWith("Patent already minted");
      }
    });

    it("Should handle marketplace with zero platform fee", async function () {
      // Set platform fee to 0
      await marketplace.setPlatformFee(0);
      
      // Mint and list NFT
      const mintingPrice = await patentNFT.getMintingPrice();
      await patentNFT.connect(user1).mintPatentNFT(user1.address, TEST_PATENT_1, { value: mintingPrice });
      await patentNFT.connect(user1).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(user1).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE);
      
      // Buy NFT
      await marketplace.connect(user2).buyNFT(1, { value: NFT_PRICE });
      
      // All payment should go to seller
      expect(await marketplace.pendingWithdrawals(user1.address)).to.equal(NFT_PRICE);
      expect(await marketplace.pendingWithdrawals(feeRecipient.address)).to.equal(0);
    });

    it("Should handle token supply limits correctly", async function () {
      const currentSupply = await pspToken.totalSupply();
      const maxSupply = ethers.parseEther("10000000"); // 10 million PSP
      const remainingSupply = maxSupply - currentSupply;
      
      // Should be able to mint up to max supply
      await pspToken.mint(user1.address, remainingSupply);
      expect(await pspToken.totalSupply()).to.equal(maxSupply);
      
      // Should not be able to mint more
      await expect(
        pspToken.mint(user1.address, 1)
      ).to.be.revertedWith("Would exceed maximum supply");
    });
  });

  // Helper function
  async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock('latest');
    return block.timestamp;
  }
});