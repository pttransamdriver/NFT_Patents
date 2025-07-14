const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SearchPayment", function () {
  let searchPayment;
  let pspToken;
  let mockUSDC;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  // Payment prices (equivalent to $5 USD)
  const ETH_PRICE = ethers.parseEther("0.002"); // 0.002 ETH
  const USDC_PRICE = ethers.parseUnits("5", 6); // 5 USDC (6 decimals)
  const PSP_PRICE = ethers.parseEther("500"); // 500 PSP tokens

  // Token price for PSP (for purchasing)
  const PSP_TOKEN_PRICE = ethers.parseEther("0.00001"); // 0.00001 ETH per PSP

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy PSP Token
    const PSPToken = await ethers.getContractFactory("PSPToken");
    pspToken = await PSPToken.deploy(PSP_TOKEN_PRICE);
    await pspToken.waitForDeployment();

    // Deploy Mock USDC (using PSPToken as template for simplicity)
    const MockUSDC = await ethers.getContractFactory("PSPToken");
    mockUSDC = await MockUSDC.deploy(ethers.parseEther("0.001")); // Mock price
    await mockUSDC.waitForDeployment();

    // Deploy SearchPayment
    const SearchPayment = await ethers.getContractFactory("SearchPayment");
    searchPayment = await SearchPayment.deploy(
      await pspToken.getAddress(),
      await mockUSDC.getAddress(),
      ETH_PRICE,
      USDC_PRICE,
      PSP_PRICE
    );
    await searchPayment.waitForDeployment();

    // Authorize SearchPayment to spend PSP tokens
    await pspToken.setAuthorizedSpender(await searchPayment.getAddress(), true);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await searchPayment.owner()).to.equal(owner.address);
    });

    it("Should set correct token addresses", async function () {
      const [pspAddress, usdcAddress] = await searchPayment.getTokenAddresses();
      expect(pspAddress).to.equal(await pspToken.getAddress());
      expect(usdcAddress).to.equal(await mockUSDC.getAddress());
    });

    it("Should set correct search prices", async function () {
      const [ethPrice, usdcPrice, pspPrice] = await searchPayment.getAllSearchPrices();
      expect(ethPrice).to.equal(ETH_PRICE);
      expect(usdcPrice).to.equal(USDC_PRICE);
      expect(pspPrice).to.equal(PSP_PRICE);
    });

    it("Should not be paused initially", async function () {
      expect(await searchPayment.paused()).to.equal(false);
    });
  });

  describe("ETH Payments", function () {
    it("Should accept ETH payment for search", async function () {
      const initialBalance = await ethers.provider.getBalance(await searchPayment.getAddress());
      
      await expect(searchPayment.connect(addr1).payWithETH({ value: ETH_PRICE }))
        .to.emit(searchPayment, "PaymentReceived");

      const finalBalance = await ethers.provider.getBalance(await searchPayment.getAddress());
      expect(finalBalance - initialBalance).to.equal(ETH_PRICE);

      // Check user stats
      const [ethPaid, usdcPaid, pspPaid, searchesPurchased] = await searchPayment.getUserStats(addr1.address);
      expect(ethPaid).to.equal(ETH_PRICE);
      expect(searchesPurchased).to.equal(1);
    });

    it("Should refund excess ETH", async function () {
      const excessAmount = ETH_PRICE + ethers.parseEther("0.001");
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      
      const tx = await searchPayment.connect(addr1).payWithETH({ value: excessAmount });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      const expectedBalance = initialBalance - ETH_PRICE - gasUsed;
      
      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.0001"));
    });

    it("Should reject insufficient ETH payment", async function () {
      const insufficientAmount = ETH_PRICE - ethers.parseEther("0.0001");
      
      await expect(searchPayment.connect(addr1).payWithETH({ value: insufficientAmount }))
        .to.be.revertedWith("Insufficient ETH payment");
    });

    it("Should reject ETH payment when paused", async function () {
      await searchPayment.pause();
      
      await expect(searchPayment.connect(addr1).payWithETH({ value: ETH_PRICE }))
        .to.be.revertedWithCustomError(searchPayment, "EnforcedPause");
    });
  });

  describe("PSP Token Payments", function () {
    beforeEach(async function () {
      // Give addr1 some PSP tokens
      const ethAmount = ethers.parseEther("0.1"); // Buy PSP tokens with ETH
      await pspToken.connect(addr1).purchaseTokens({ value: ethAmount });
      
      // Approve SearchPayment to spend PSP tokens
      await pspToken.connect(addr1).approve(await searchPayment.getAddress(), PSP_PRICE);
    });

    it("Should accept PSP token payment for search", async function () {
      const initialBalance = await pspToken.balanceOf(addr1.address);
      
      await expect(searchPayment.connect(addr1).payWithPSP())
        .to.emit(searchPayment, "PaymentReceived");

      const finalBalance = await pspToken.balanceOf(addr1.address);
      expect(initialBalance - finalBalance).to.equal(PSP_PRICE);

      // Check user stats
      const [ethPaid, usdcPaid, pspPaid, searchesPurchased] = await searchPayment.getUserStats(addr1.address);
      expect(pspPaid).to.equal(PSP_PRICE);
      expect(searchesPurchased).to.equal(1);
    });

    it("Should reject PSP payment with insufficient balance", async function () {
      // Try to pay with addr2 who has no PSP tokens
      await expect(searchPayment.connect(addr2).payWithPSP())
        .to.be.revertedWith("Insufficient PSP token balance");
    });

    it("Should reject PSP payment without approval", async function () {
      // Remove approval
      await pspToken.connect(addr1).approve(await searchPayment.getAddress(), 0);
      
      await expect(searchPayment.connect(addr1).payWithPSP())
        .to.be.revertedWith("PSP token transfer failed");
    });

    it("Should work with legacy payForSearch function", async function () {
      await expect(searchPayment.connect(addr1).payForSearch())
        .to.emit(searchPayment, "PaymentReceived");
    });
  });

  describe("USDC Payments", function () {
    beforeEach(async function () {
      // Give addr1 some USDC tokens (using mock USDC)
      const ethAmount = ethers.parseEther("0.01");
      await mockUSDC.connect(addr1).purchaseTokens({ value: ethAmount });
      
      // Approve SearchPayment to spend USDC tokens
      await mockUSDC.connect(addr1).approve(await searchPayment.getAddress(), USDC_PRICE);
    });

    it("Should accept USDC payment for search", async function () {
      const initialBalance = await mockUSDC.balanceOf(addr1.address);
      
      await expect(searchPayment.connect(addr1).payWithUSDC())
        .to.emit(searchPayment, "PaymentReceived");

      const finalBalance = await mockUSDC.balanceOf(addr1.address);
      expect(initialBalance - finalBalance).to.equal(USDC_PRICE);

      // Check user stats
      const [ethPaid, usdcPaid, pspPaid, searchesPurchased] = await searchPayment.getUserStats(addr1.address);
      expect(usdcPaid).to.equal(USDC_PRICE);
      expect(searchesPurchased).to.equal(1);
    });

    it("Should reject USDC payment with insufficient balance", async function () {
      await expect(searchPayment.connect(addr2).payWithUSDC())
        .to.be.revertedWith("Insufficient USDC balance");
    });
  });

  describe("Price Management", function () {
    it("Should allow owner to update ETH price", async function () {
      const newPrice = ethers.parseEther("0.003");
      
      await expect(searchPayment.updateSearchPrice(0, newPrice)) // 0 = PaymentToken.ETH
        .to.emit(searchPayment, "PriceUpdated");
      
      const [ethPrice, , ] = await searchPayment.getAllSearchPrices();
      expect(ethPrice).to.equal(newPrice);
    });

    it("Should allow owner to update USDC price", async function () {
      const newPrice = ethers.parseUnits("6", 6);
      
      await searchPayment.updateSearchPrice(1, newPrice); // 1 = PaymentToken.USDC
      
      const [, usdcPrice, ] = await searchPayment.getAllSearchPrices();
      expect(usdcPrice).to.equal(newPrice);
    });

    it("Should allow owner to update PSP price", async function () {
      const newPrice = ethers.parseEther("600");
      
      await searchPayment.updateSearchPrice(2, newPrice); // 2 = PaymentToken.PSP
      
      const [, , pspPrice] = await searchPayment.getAllSearchPrices();
      expect(pspPrice).to.equal(newPrice);
    });

    it("Should reject price updates by non-owner", async function () {
      const newPrice = ethers.parseEther("0.003");
      
      await expect(searchPayment.connect(addr1).updateSearchPrice(0, newPrice))
        .to.be.revertedWithCustomError(searchPayment, "OwnableUnauthorizedAccount");
    });

    it("Should reject zero price updates", async function () {
      await expect(searchPayment.updateSearchPrice(0, 0))
        .to.be.revertedWith("Price must be greater than 0");
    });

    it("Should work with legacy price update function", async function () {
      const newPrice = ethers.parseEther("600");
      
      await searchPayment.updateSearchPrice(newPrice);
      
      const legacyPrice = await searchPayment.getSearchPrice();
      expect(legacyPrice).to.equal(newPrice);
    });
  });

  describe("Withdrawal Functions", function () {
    beforeEach(async function () {
      // Add some funds to the contract
      await searchPayment.connect(addr1).payWithETH({ value: ETH_PRICE });
      
      // Add PSP tokens
      const ethAmount = ethers.parseEther("0.1");
      await pspToken.connect(addr1).purchaseTokens({ value: ethAmount });
      await pspToken.connect(addr1).approve(await searchPayment.getAddress(), PSP_PRICE);
      await searchPayment.connect(addr1).payWithPSP();
    });

    it("Should allow owner to withdraw ETH", async function () {
      const contractBalance = await ethers.provider.getBalance(await searchPayment.getAddress());
      expect(contractBalance).to.be.gt(0);
      
      await expect(searchPayment.withdrawETH())
        .to.emit(searchPayment, "TokensWithdrawn");
      
      const finalBalance = await ethers.provider.getBalance(await searchPayment.getAddress());
      expect(finalBalance).to.equal(0);
    });

    it("Should allow owner to withdraw PSP tokens", async function () {
      const contractBalance = await pspToken.balanceOf(await searchPayment.getAddress());
      expect(contractBalance).to.be.gt(0);
      
      await searchPayment.withdrawPSP();
      
      const finalBalance = await pspToken.balanceOf(await searchPayment.getAddress());
      expect(finalBalance).to.equal(0);
    });

    it("Should reject withdrawal by non-owner", async function () {
      await expect(searchPayment.connect(addr1).withdrawETH())
        .to.be.revertedWithCustomError(searchPayment, "OwnableUnauthorizedAccount");
    });

    it("Should work with legacy withdrawal function", async function () {
      await expect(searchPayment.withdrawTokens())
        .to.emit(searchPayment, "TokensWithdrawn");
    });
  });

  describe("View Functions", function () {
    it("Should return correct search prices", async function () {
      expect(await searchPayment.getSearchPrice(0)).to.equal(ETH_PRICE); // ETH
      expect(await searchPayment.getSearchPrice(1)).to.equal(USDC_PRICE); // USDC
      expect(await searchPayment.getSearchPrice(2)).to.equal(PSP_PRICE); // PSP
    });

    it("Should return legacy search price", async function () {
      expect(await searchPayment.getSearchPrice()).to.equal(PSP_PRICE);
    });

    it("Should return correct token balances", async function () {
      // Add some funds first
      await searchPayment.connect(addr1).payWithETH({ value: ETH_PRICE });
      
      expect(await searchPayment.getTokenBalance(0)).to.equal(ETH_PRICE); // ETH balance
      expect(await searchPayment.getTokenBalance()).to.be.gte(0); // Legacy PSP balance
    });

    it("Should return searches per payment", async function () {
      expect(await searchPayment.getSearchesPerPayment()).to.equal(1);
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause and unpause", async function () {
      await searchPayment.pause();
      expect(await searchPayment.paused()).to.equal(true);
      
      await searchPayment.unpause();
      expect(await searchPayment.paused()).to.equal(false);
    });

    it("Should prevent payments when paused", async function () {
      await searchPayment.pause();
      
      await expect(searchPayment.connect(addr1).payWithETH({ value: ETH_PRICE }))
        .to.be.revertedWithCustomError(searchPayment, "EnforcedPause");
    });
  });
});
