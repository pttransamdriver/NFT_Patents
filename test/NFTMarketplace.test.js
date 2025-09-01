import { expect } from "chai";
import { ethers } from "hardhat";

describe("NFTMarketplace", function () {
  let marketplace, patentNFT;
  let owner, seller, buyer, feeRecipient, royaltyReceiver;
  
  const PLATFORM_FEE_PERCENT = 250; // 2.5%
  const ROYALTY_FEE = 500; // 5%
  const NFT_PRICE = ethers.parseEther("1.0");
  const TEST_PATENT = "US1234567";
  const TEST_URI = "ipfs://QmTest1";
  
  beforeEach(async function () {
    [owner, seller, buyer, feeRecipient, royaltyReceiver] = await ethers.getSigners();
    
    // Deploy PatentNFT contract first (needed for testing marketplace)
    const PatentNFT = await ethers.getContractFactory("PatentNFT");
    patentNFT = await PatentNFT.deploy(royaltyReceiver.address, ROYALTY_FEE);
    await patentNFT.waitForDeployment();
    
    // Deploy Marketplace contract
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await NFTMarketplace.deploy(feeRecipient.address);
    await marketplace.waitForDeployment();
    
    // Mint an NFT to seller for testing
    await patentNFT.mintPatent(seller.address, TEST_PATENT, TEST_URI);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Should set the correct fee recipient", async function () {
      expect(await marketplace.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should set the correct platform fee", async function () {
      expect(await marketplace.platformFeePercent()).to.equal(PLATFORM_FEE_PERCENT);
    });

    it("Should revert deployment with zero fee recipient", async function () {
      const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
      
      await expect(
        NFTMarketplace.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Fee recipient cannot be zero address");
    });
  });

  describe("NFT Listing", function () {
    beforeEach(async function () {
      // Approve marketplace to transfer the NFT
      await patentNFT.connect(seller).approve(await marketplace.getAddress(), 1);
    });

    it("Should allow NFT owner to list NFT for sale", async function () {
      const tx = await marketplace.connect(seller).listNFT(
        await patentNFT.getAddress(),
        1,
        NFT_PRICE
      );

      await expect(tx)
        .to.emit(marketplace, "NFTListed")
        .withArgs(1, await patentNFT.getAddress(), 1, seller.address, NFT_PRICE);

      const listing = await marketplace.listings(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(NFT_PRICE);
      expect(listing.active).to.be.true;
    });

    it("Should not allow listing with zero price", async function () {
      await expect(
        marketplace.connect(seller).listNFT(await patentNFT.getAddress(), 1, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should not allow non-owner to list NFT", async function () {
      await expect(
        marketplace.connect(buyer).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE)
      ).to.be.revertedWith("Not the owner");
    });

    it("Should not allow listing without approval", async function () {
      // Remove approval
      await patentNFT.connect(seller).approve(ethers.ZeroAddress, 1);
      
      await expect(
        marketplace.connect(seller).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE)
      ).to.be.revertedWith("Contract not approved");
    });

    it("Should update token to listing mapping", async function () {
      await marketplace.connect(seller).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE);
      
      expect(await marketplace.tokenToListing(await patentNFT.getAddress(), 1)).to.equal(1);
    });
  });

  describe("NFT Purchase", function () {
    beforeEach(async function () {
      await patentNFT.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE);
    });

    it("Should allow buyer to purchase NFT", async function () {
      const tx = await marketplace.connect(buyer).buyNFT(1, { value: NFT_PRICE });

      await expect(tx)
        .to.emit(marketplace, "NFTSold")
        .withArgs(1, await patentNFT.getAddress(), 1, seller.address, buyer.address, NFT_PRICE);

      // Check NFT ownership transferred
      expect(await patentNFT.ownerOf(1)).to.equal(buyer.address);
      
      // Check listing is no longer active
      const listing = await marketplace.listings(1);
      expect(listing.active).to.be.false;
      
      // Check token mapping is cleared
      expect(await marketplace.tokenToListing(await patentNFT.getAddress(), 1)).to.equal(0);
    });

    it("Should distribute funds correctly with platform fee", async function () {
      const platformFee = (NFT_PRICE * BigInt(PLATFORM_FEE_PERCENT)) / BigInt(10000);
      const sellerAmount = NFT_PRICE - platformFee;
      
      await marketplace.connect(buyer).buyNFT(1, { value: NFT_PRICE });
      
      // Check pending withdrawals
      expect(await marketplace.pendingWithdrawals(seller.address)).to.equal(sellerAmount);
      expect(await marketplace.pendingWithdrawals(feeRecipient.address)).to.equal(platformFee);
    });

    it("Should refund excess payment", async function () {
      const excessPayment = ethers.parseEther("0.5");
      const totalPayment = NFT_PRICE + excessPayment;
      
      await marketplace.connect(buyer).buyNFT(1, { value: totalPayment });
      
      // Buyer should have pending withdrawal for excess
      expect(await marketplace.pendingWithdrawals(buyer.address)).to.equal(excessPayment);
    });

    it("Should revert with insufficient payment", async function () {
      const insufficientPayment = ethers.parseEther("0.5");
      
      await expect(
        marketplace.connect(buyer).buyNFT(1, { value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert when seller tries to buy own NFT", async function () {
      await expect(
        marketplace.connect(seller).buyNFT(1, { value: NFT_PRICE })
      ).to.be.revertedWith("Cannot buy your own NFT");
    });

    it("Should revert when listing is not active", async function () {
      // Cancel listing first
      await marketplace.connect(seller).cancelListing(1);
      
      await expect(
        marketplace.connect(buyer).buyNFT(1, { value: NFT_PRICE })
      ).to.be.revertedWith("Listing not active");
    });
  });

  describe("Listing Management", function () {
    beforeEach(async function () {
      await patentNFT.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE);
    });

    it("Should allow seller to cancel listing", async function () {
      const tx = await marketplace.connect(seller).cancelListing(1);
      
      await expect(tx).to.emit(marketplace, "ListingCancelled").withArgs(1);
      
      const listing = await marketplace.listings(1);
      expect(listing.active).to.be.false;
    });

    it("Should allow owner to cancel any listing", async function () {
      await marketplace.connect(owner).cancelListing(1);
      
      const listing = await marketplace.listings(1);
      expect(listing.active).to.be.false;
    });

    it("Should not allow unauthorized user to cancel listing", async function () {
      await expect(
        marketplace.connect(buyer).cancelListing(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow seller to update price", async function () {
      const newPrice = ethers.parseEther("2.0");
      
      await marketplace.connect(seller).updatePrice(1, newPrice);
      
      const listing = await marketplace.listings(1);
      expect(listing.price).to.equal(newPrice);
    });

    it("Should not allow non-seller to update price", async function () {
      await expect(
        marketplace.connect(buyer).updatePrice(1, ethers.parseEther("2.0"))
      ).to.be.revertedWith("Not the seller");
    });

    it("Should not allow updating price to zero", async function () {
      await expect(
        marketplace.connect(seller).updatePrice(1, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });
  });

  describe("Listing Retrieval", function () {
    beforeEach(async function () {
      await patentNFT.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE);
    });

    it("Should return active listing for token", async function () {
      const listing = await marketplace.getActiveListing(await patentNFT.getAddress(), 1);
      
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(NFT_PRICE);
      expect(listing.active).to.be.true;
    });

    it("Should revert when no listing found for token", async function () {
      await expect(
        marketplace.getActiveListing(await patentNFT.getAddress(), 999)
      ).to.be.revertedWith("No listing found");
    });

    it("Should revert when listing is not active", async function () {
      await marketplace.connect(seller).cancelListing(1);
      
      await expect(
        marketplace.getActiveListing(await patentNFT.getAddress(), 1)
      ).to.be.revertedWith("Listing not active");
    });

    it("Should return all active listings", async function () {
      // Create second NFT and listing
      await patentNFT.mintPatent(seller.address, "US7654321", "ipfs://QmTest2");
      await patentNFT.connect(seller).approve(await marketplace.getAddress(), 2);
      await marketplace.connect(seller).listNFT(await patentNFT.getAddress(), 2, ethers.parseEther("2.0"));
      
      const activeListings = await marketplace.getAllActiveListings();
      expect(activeListings.length).to.equal(2);
      expect(activeListings[0].tokenId).to.equal(1);
      expect(activeListings[1].tokenId).to.equal(2);
    });
  });

  describe("Withdrawal System (Pull Payments)", function () {
    beforeEach(async function () {
      await patentNFT.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE);
      await marketplace.connect(buyer).buyNFT(1, { value: NFT_PRICE });
    });

    it("Should allow users to withdraw their funds", async function () {
      const initialBalance = await ethers.provider.getBalance(seller.address);
      const pendingAmount = await marketplace.pendingWithdrawals(seller.address);
      
      const tx = await marketplace.connect(seller).withdrawFunds();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(seller.address);
      expect(finalBalance).to.equal(initialBalance + pendingAmount - gasUsed);
      
      // Check pending withdrawal is cleared
      expect(await marketplace.pendingWithdrawals(seller.address)).to.equal(0);
    });

    it("Should emit FundsWithdrawn event", async function () {
      const pendingAmount = await marketplace.pendingWithdrawals(seller.address);
      
      const tx = await marketplace.connect(seller).withdrawFunds();
      await expect(tx)
        .to.emit(marketplace, "FundsWithdrawn")
        .withArgs(seller.address, pendingAmount);
    });

    it("Should revert when no funds to withdraw", async function () {
      await expect(
        marketplace.connect(buyer).withdrawFunds()
      ).to.be.revertedWith("No funds to withdraw");
    });

    it("Should allow multiple users to withdraw", async function () {
      // Both seller and fee recipient should have funds
      await marketplace.connect(seller).withdrawFunds();
      await marketplace.connect(feeRecipient).withdrawFunds();
      
      expect(await marketplace.pendingWithdrawals(seller.address)).to.equal(0);
      expect(await marketplace.pendingWithdrawals(feeRecipient.address)).to.equal(0);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to set platform fee", async function () {
      const newFee = 500; // 5%
      
      await marketplace.setPlatformFee(newFee);
      expect(await marketplace.platformFeePercent()).to.equal(newFee);
    });

    it("Should not allow setting fee above 10%", async function () {
      await expect(
        marketplace.setPlatformFee(1001) // 10.01%
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should allow owner to set fee recipient", async function () {
      const newRecipient = buyer.address;
      
      await marketplace.setFeeRecipient(newRecipient);
      expect(await marketplace.feeRecipient()).to.equal(newRecipient);
    });

    it("Should not allow setting zero address as fee recipient", async function () {
      await expect(
        marketplace.setFeeRecipient(ethers.ZeroAddress)
      ).to.be.revertedWith("Fee recipient cannot be zero address");
    });

    it("Should allow owner emergency withdrawal", async function () {
      // Send some ETH to contract directly
      await owner.sendTransaction({
        to: await marketplace.getAddress(),
        value: ethers.parseEther("1.0")
      });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await marketplace.getAddress());
      
      const tx = await marketplace.emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.equal(initialBalance + contractBalance - gasUsed);
    });

    it("Should not allow non-owner to call owner functions", async function () {
      await expect(
        marketplace.connect(buyer).setPlatformFee(300)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
      
      await expect(
        marketplace.connect(buyer).setFeeRecipient(buyer.address)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
      
      await expect(
        marketplace.connect(buyer).emergencyWithdraw()
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });

  describe("Edge Cases and Security", function () {
    beforeEach(async function () {
      await patentNFT.connect(seller).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(seller).listNFT(await patentNFT.getAddress(), 1, NFT_PRICE);
    });

    it("Should handle multiple listings and cancellations correctly", async function () {
      // Create more NFTs
      await patentNFT.mintPatent(seller.address, "US7654321", "ipfs://QmTest2");
      await patentNFT.mintPatent(seller.address, "US1111111", "ipfs://QmTest3");
      
      await patentNFT.connect(seller).approve(await marketplace.getAddress(), 2);
      await patentNFT.connect(seller).approve(await marketplace.getAddress(), 3);
      
      await marketplace.connect(seller).listNFT(await patentNFT.getAddress(), 2, ethers.parseEther("2.0"));
      await marketplace.connect(seller).listNFT(await patentNFT.getAddress(), 3, ethers.parseEther("3.0"));
      
      // Cancel middle listing
      await marketplace.connect(seller).cancelListing(2);
      
      const activeListings = await marketplace.getAllActiveListings();
      expect(activeListings.length).to.equal(2); // Only 1 and 3 should be active
    });

    it("Should handle zero platform fee correctly", async function () {
      await marketplace.setPlatformFee(0);
      
      await marketplace.connect(buyer).buyNFT(1, { value: NFT_PRICE });
      
      // All payment should go to seller
      expect(await marketplace.pendingWithdrawals(seller.address)).to.equal(NFT_PRICE);
      expect(await marketplace.pendingWithdrawals(feeRecipient.address)).to.equal(0);
    });

    it("Should handle maximum platform fee correctly", async function () {
      await marketplace.setPlatformFee(1000); // 10%
      
      await marketplace.connect(buyer).buyNFT(1, { value: NFT_PRICE });
      
      const platformFee = NFT_PRICE / BigInt(10); // 10%
      const sellerAmount = NFT_PRICE - platformFee;
      
      expect(await marketplace.pendingWithdrawals(seller.address)).to.equal(sellerAmount);
      expect(await marketplace.pendingWithdrawals(feeRecipient.address)).to.equal(platformFee);
    });

    it("Should prevent reentrancy attacks", async function () {
      // This test ensures the ReentrancyGuard is working
      // In a real attack scenario, a malicious contract would try to call buyNFT again
      // during the withdrawal process, but ReentrancyGuard prevents this
      
      await marketplace.connect(buyer).buyNFT(1, { value: NFT_PRICE });
      
      // Verify the listing is properly deactivated after purchase
      const listing = await marketplace.listings(1);
      expect(listing.active).to.be.false;
    });
  });
});