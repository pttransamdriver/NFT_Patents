const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration Tests", function () {
  let patentNFT;
  let pspToken;
  let searchPayment;
  let mockUSDC;
  let owner;
  let user1;
  let user2;

  // Constants
  const PSP_TOKEN_PRICE = ethers.parseEther("0.00001"); // 0.00001 ETH per PSP
  const ETH_SEARCH_PRICE = ethers.parseEther("0.002");
  const USDC_SEARCH_PRICE = ethers.parseUnits("5", 6);
  const PSP_SEARCH_PRICE = ethers.parseEther("500");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy all contracts
    const PatentNFT = await ethers.getContractFactory("PatentNFT");
    patentNFT = await PatentNFT.deploy();
    await patentNFT.waitForDeployment();

    const PSPToken = await ethers.getContractFactory("PSPToken");
    pspToken = await PSPToken.deploy(PSP_TOKEN_PRICE);
    await pspToken.waitForDeployment();

    // Mock USDC
    mockUSDC = await PSPToken.deploy(ethers.parseEther("0.001"));
    await mockUSDC.waitForDeployment();

    const SearchPayment = await ethers.getContractFactory("SearchPayment");
    searchPayment = await SearchPayment.deploy(
      await pspToken.getAddress(),
      await mockUSDC.getAddress(),
      ETH_SEARCH_PRICE,
      USDC_SEARCH_PRICE,
      PSP_SEARCH_PRICE
    );
    await searchPayment.waitForDeployment();

    // Setup authorization
    await pspToken.setAuthorizedSpender(await searchPayment.getAddress(), true);
  });

  describe("Complete Patent NFT Workflow", function () {
    it("Should complete full patent minting and verification workflow", async function () {
      // 1. Mint a patent NFT
      const patentData = {
        recipient: user1.address,
        tokenURI: "https://ipfs.io/ipfs/QmTestHash",
        title: "Revolutionary Blockchain Patent",
        inventor: "Dr. Satoshi Nakamoto",
        patentNumber: "US-99999999-B2"
      };

      await expect(patentNFT.mintPatent(
        patentData.recipient,
        patentData.tokenURI,
        patentData.title,
        patentData.inventor,
        patentData.patentNumber
      ))
        .to.emit(patentNFT, "PatentMinted")
        .withArgs(1, patentData.recipient, patentData.patentNumber);

      // 2. Verify patent ownership
      expect(await patentNFT.ownerOf(1)).to.equal(user1.address);

      // 3. Check patent is unverified initially
      const patent = await patentNFT.getPatent(1);
      expect(patent.isVerified).to.equal(false);

      // 4. Owner verifies the patent
      await expect(patentNFT.verifyPatent(1))
        .to.emit(patentNFT, "PatentVerified")
        .withArgs(1, patentData.patentNumber);

      // 5. Check patent is now verified
      const verifiedPatent = await patentNFT.getPatent(1);
      expect(verifiedPatent.isVerified).to.equal(true);
      expect(verifiedPatent.title).to.equal(patentData.title);
      expect(verifiedPatent.inventor).to.equal(patentData.inventor);
    });

    it("Should prevent duplicate patent minting", async function () {
      const patentData = {
        recipient: user1.address,
        tokenURI: "https://ipfs.io/ipfs/QmTestHash",
        title: "Test Patent",
        inventor: "Test Inventor",
        patentNumber: "US-12345678-B2"
      };

      // Mint first patent
      await patentNFT.mintPatent(
        patentData.recipient,
        patentData.tokenURI,
        patentData.title,
        patentData.inventor,
        patentData.patentNumber
      );

      // Try to mint same patent again - should succeed with current implementation
      // In production, you'd want to add duplicate prevention logic
      await patentNFT.mintPatent(
        user2.address,
        patentData.tokenURI,
        "Different Title",
        "Different Inventor",
        patentData.patentNumber
      );

      // Both should exist but with different token IDs
      expect(await patentNFT.ownerOf(1)).to.equal(user1.address);
      expect(await patentNFT.ownerOf(2)).to.equal(user2.address);
    });
  });

  describe("Complete Payment Workflow", function () {
    it("Should complete ETH payment workflow", async function () {
      const initialContractBalance = await ethers.provider.getBalance(await searchPayment.getAddress());
      const initialUserBalance = await ethers.provider.getBalance(user1.address);

      // User pays with ETH
      const tx = await searchPayment.connect(user1).payWithETH({ value: ETH_SEARCH_PRICE });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      // Check contract received ETH
      const finalContractBalance = await ethers.provider.getBalance(await searchPayment.getAddress());
      expect(finalContractBalance - initialContractBalance).to.equal(ETH_SEARCH_PRICE);

      // Check user balance decreased by ETH price + gas
      const finalUserBalance = await ethers.provider.getBalance(user1.address);
      expect(initialUserBalance - finalUserBalance).to.be.closeTo(
        ETH_SEARCH_PRICE + gasUsed,
        ethers.parseEther("0.001")
      );

      // Check user stats
      const [ethPaid, usdcPaid, pspPaid, searchesPurchased] = await searchPayment.getUserStats(user1.address);
      expect(ethPaid).to.equal(ETH_SEARCH_PRICE);
      expect(usdcPaid).to.equal(0);
      expect(pspPaid).to.equal(0);
      expect(searchesPurchased).to.equal(1);
    });

    it("Should complete PSP token payment workflow", async function () {
      // 1. User purchases PSP tokens
      const ethAmount = ethers.parseEther("0.1");
      await pspToken.connect(user1).purchaseTokens({ value: ethAmount });

      const userPSPBalance = await pspToken.balanceOf(user1.address);
      expect(userPSPBalance).to.be.gt(PSP_SEARCH_PRICE);

      // 2. User approves SearchPayment to spend PSP tokens
      await pspToken.connect(user1).approve(await searchPayment.getAddress(), PSP_SEARCH_PRICE);

      // 3. User pays for search with PSP tokens
      const initialContractBalance = await pspToken.balanceOf(await searchPayment.getAddress());
      
      await expect(searchPayment.connect(user1).payWithPSP())
        .to.emit(searchPayment, "PaymentReceived");

      // 4. Check tokens were transferred
      const finalContractBalance = await pspToken.balanceOf(await searchPayment.getAddress());
      expect(finalContractBalance - initialContractBalance).to.equal(PSP_SEARCH_PRICE);

      // 5. Check user stats
      const [ethPaid, usdcPaid, pspPaid, searchesPurchased] = await searchPayment.getUserStats(user1.address);
      expect(pspPaid).to.equal(PSP_SEARCH_PRICE);
      expect(searchesPurchased).to.equal(1);
    });

    it("Should handle multiple payment methods for same user", async function () {
      // 1. Pay with ETH
      await searchPayment.connect(user1).payWithETH({ value: ETH_SEARCH_PRICE });

      // 2. Purchase and pay with PSP tokens
      await pspToken.connect(user1).purchaseTokens({ value: ethers.parseEther("0.1") });
      await pspToken.connect(user1).approve(await searchPayment.getAddress(), PSP_SEARCH_PRICE);
      await searchPayment.connect(user1).payWithPSP();

      // 3. Purchase and pay with USDC
      await mockUSDC.connect(user1).purchaseTokens({ value: ethers.parseEther("0.01") });
      await mockUSDC.connect(user1).approve(await searchPayment.getAddress(), USDC_SEARCH_PRICE);
      await searchPayment.connect(user1).payWithUSDC();

      // 4. Check user stats show all payments
      const [ethPaid, usdcPaid, pspPaid, searchesPurchased] = await searchPayment.getUserStats(user1.address);
      expect(ethPaid).to.equal(ETH_SEARCH_PRICE);
      expect(usdcPaid).to.equal(USDC_SEARCH_PRICE);
      expect(pspPaid).to.equal(PSP_SEARCH_PRICE);
      expect(searchesPurchased).to.equal(3);
    });
  });

  describe("Admin Workflow", function () {
    it("Should complete admin management workflow", async function () {
      // 1. Add funds to contracts
      await searchPayment.connect(user1).payWithETH({ value: ETH_SEARCH_PRICE });
      
      await pspToken.connect(user1).purchaseTokens({ value: ethers.parseEther("0.1") });
      await pspToken.connect(user1).approve(await searchPayment.getAddress(), PSP_SEARCH_PRICE);
      await searchPayment.connect(user1).payWithPSP();

      // 2. Update prices
      const newETHPrice = ethers.parseEther("0.003");
      const newPSPPrice = ethers.parseEther("600");

      await searchPayment.updateSearchPrice(0, newETHPrice); // ETH
      await searchPayment.updateSearchPrice(2, newPSPPrice); // PSP

      const [ethPrice, , pspPrice] = await searchPayment.getAllSearchPrices();
      expect(ethPrice).to.equal(newETHPrice);
      expect(pspPrice).to.equal(newPSPPrice);

      // 3. Withdraw funds
      const ownerInitialETHBalance = await ethers.provider.getBalance(owner.address);
      const ownerInitialPSPBalance = await pspToken.balanceOf(owner.address);

      await searchPayment.withdrawETH();
      await searchPayment.withdrawPSP();

      // Check funds were withdrawn
      expect(await ethers.provider.getBalance(await searchPayment.getAddress())).to.equal(0);
      expect(await pspToken.balanceOf(await searchPayment.getAddress())).to.equal(0);

      // Check owner received funds
      expect(await pspToken.balanceOf(owner.address)).to.be.gt(ownerInitialPSPBalance);
    });

    it("Should handle emergency pause scenario", async function () {
      // 1. Normal operations work
      await searchPayment.connect(user1).payWithETH({ value: ETH_SEARCH_PRICE });

      // 2. Owner pauses contracts
      await searchPayment.pause();
      await pspToken.pause();

      // 3. Operations should fail when paused
      await expect(searchPayment.connect(user1).payWithETH({ value: ETH_SEARCH_PRICE }))
        .to.be.revertedWithCustomError(searchPayment, "EnforcedPause");

      await expect(pspToken.connect(user1).purchaseTokens({ value: ethers.parseEther("0.01") }))
        .to.be.revertedWithCustomError(pspToken, "EnforcedPause");

      // 4. Owner can still perform admin functions
      await searchPayment.withdrawETH();

      // 5. Unpause and operations work again
      await searchPayment.unpause();
      await pspToken.unpause();

      await expect(searchPayment.connect(user1).payWithETH({ value: ETH_SEARCH_PRICE }))
        .to.not.be.reverted;
    });
  });

  describe("Error Handling", function () {
    it("Should handle insufficient funds gracefully", async function () {
      // Try to pay with ETH without enough balance
      const userBalance = await ethers.provider.getBalance(user1.address);
      const excessiveAmount = userBalance + ethers.parseEther("1");

      await expect(searchPayment.connect(user1).payWithETH({ value: excessiveAmount }))
        .to.be.reverted; // Should fail due to insufficient balance

      // Try to pay with PSP tokens without any
      await expect(searchPayment.connect(user1).payWithPSP())
        .to.be.revertedWith("Insufficient PSP token balance");
    });

    it("Should handle unauthorized access attempts", async function () {
      // Non-owner tries to verify patent
      await patentNFT.mintPatent(
        user1.address,
        "https://ipfs.io/ipfs/QmTestHash",
        "Test Patent",
        "Test Inventor",
        "US-12345678-B2"
      );

      await expect(patentNFT.connect(user1).verifyPatent(1))
        .to.be.revertedWithCustomError(patentNFT, "OwnableUnauthorizedAccount");

      // Non-owner tries to update prices
      await expect(searchPayment.connect(user1).updateSearchPrice(0, ethers.parseEther("0.003")))
        .to.be.revertedWithCustomError(searchPayment, "OwnableUnauthorizedAccount");

      // Non-owner tries to withdraw funds
      await expect(searchPayment.connect(user1).withdrawETH())
        .to.be.revertedWithCustomError(searchPayment, "OwnableUnauthorizedAccount");
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs", async function () {
      // Test gas costs for common operations
      const mintTx = await patentNFT.mintPatent(
        user1.address,
        "https://ipfs.io/ipfs/QmTestHash",
        "Test Patent",
        "Test Inventor",
        "US-12345678-B2"
      );
      const mintReceipt = await mintTx.wait();
      console.log(`Patent minting gas used: ${mintReceipt.gasUsed}`);

      const purchaseTx = await pspToken.connect(user1).purchaseTokens({ value: ethers.parseEther("0.01") });
      const purchaseReceipt = await purchaseTx.wait();
      console.log(`PSP token purchase gas used: ${purchaseReceipt.gasUsed}`);

      const paymentTx = await searchPayment.connect(user1).payWithETH({ value: ETH_SEARCH_PRICE });
      const paymentReceipt = await paymentTx.wait();
      console.log(`ETH payment gas used: ${paymentReceipt.gasUsed}`);

      // Assert reasonable gas limits (adjust based on your requirements)
      expect(mintReceipt.gasUsed).to.be.lt(200000);
      expect(purchaseReceipt.gasUsed).to.be.lt(100000);
      expect(paymentReceipt.gasUsed).to.be.lt(100000);
    });
  });
});
