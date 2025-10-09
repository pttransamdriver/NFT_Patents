import { expect } from "chai";
import { ethers } from "hardhat";

describe("SearchPayment", function () {
  let searchPayment, pspToken, usdcToken;
  let owner, user1, user2;
  
  const INITIAL_ETH_PRICE = ethers.parseEther("0.002"); // ~$5 worth of ETH
  const INITIAL_USDC_PRICE = 5000000; // $5 in USDC (6 decimals)
  const INITIAL_PSP_PRICE = ethers.parseEther("500"); // 500 PSP tokens
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy mock USDC token (using PSPToken as a mock ERC20)
    const MockToken = await ethers.getContractFactory("PSPToken");
    usdcToken = await MockToken.deploy(ethers.parseEther("0.000001")); // Mock USDC
    await usdcToken.waitForDeployment();
    
    // Deploy PSP token
    pspToken = await MockToken.deploy(ethers.parseEther("0.00002"));
    await pspToken.waitForDeployment();
    
    // Deploy SearchPayment contract
    const SearchPayment = await ethers.getContractFactory("SearchPayment");
    searchPayment = await SearchPayment.deploy(
      await pspToken.getAddress(),
      await usdcToken.getAddress(),
      INITIAL_ETH_PRICE,
      INITIAL_USDC_PRICE,
      INITIAL_PSP_PRICE
    );
    await searchPayment.waitForDeployment();
    
    // Give users some tokens for testing
    await pspToken.transfer(user1.address, ethers.parseEther("1000"));
    await usdcToken.transfer(user1.address, ethers.parseEther("1000"));
    
    // Users approve SearchPayment to spend their tokens
    await pspToken.connect(user1).approve(await searchPayment.getAddress(), ethers.parseEther("10000"));
    await usdcToken.connect(user1).approve(await searchPayment.getAddress(), ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await searchPayment.owner()).to.equal(owner.address);
    });

    it("Should set correct token addresses", async function () {
      const [pspAddress, usdcAddress] = await searchPayment.getTokenAddresses();
      expect(pspAddress).to.equal(await pspToken.getAddress());
      expect(usdcAddress).to.equal(await usdcToken.getAddress());
    });

    it("Should set correct initial prices", async function () {
      const [ethPrice, usdcPrice, pspPrice] = await searchPayment.getAllSearchPrices();
      expect(ethPrice).to.equal(INITIAL_ETH_PRICE);
      expect(usdcPrice).to.equal(INITIAL_USDC_PRICE);
      expect(pspPrice).to.equal(INITIAL_PSP_PRICE);
    });

    it("Should revert with zero PSP token address", async function () {
      const SearchPayment = await ethers.getContractFactory("SearchPayment");
      
      await expect(
        SearchPayment.deploy(
          ethers.ZeroAddress,
          await usdcToken.getAddress(),
          INITIAL_ETH_PRICE,
          INITIAL_USDC_PRICE,
          INITIAL_PSP_PRICE
        )
      ).to.be.revertedWith("PSP token address cannot be zero");
    });

    it("Should revert with zero USDC token address", async function () {
      const SearchPayment = await ethers.getContractFactory("SearchPayment");
      
      await expect(
        SearchPayment.deploy(
          await pspToken.getAddress(),
          ethers.ZeroAddress,
          INITIAL_ETH_PRICE,
          INITIAL_USDC_PRICE,
          INITIAL_PSP_PRICE
        )
      ).to.be.revertedWith("USDC token address cannot be zero");
    });
  });

  describe("ETH Payment", function () {
    it("Should allow payment with ETH", async function () {
      const tx = await searchPayment.connect(user1).payWithETH({ value: INITIAL_ETH_PRICE });
      
      await expect(tx)
        .to.emit(searchPayment, "PaymentReceived")
        .withArgs(user1.address, 0, INITIAL_ETH_PRICE, await getBlockTimestamp(), 1);
      
      expect(await searchPayment.userSearchesPurchased(user1.address)).to.equal(1);
      expect(await searchPayment.getUserTokenStats(user1.address, 0)).to.equal(INITIAL_ETH_PRICE);
    });

    it("Should refund excess ETH", async function () {
      const excessAmount = ethers.parseEther("0.001");
      const totalPayment = INITIAL_ETH_PRICE + excessAmount;
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      const tx = await searchPayment.connect(user1).payWithETH({ value: totalPayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      
      // User should pay only the required amount plus gas
      expect(finalBalance).to.equal(initialBalance - INITIAL_ETH_PRICE - gasUsed);
    });

    it("Should revert with insufficient ETH", async function () {
      const insufficientAmount = INITIAL_ETH_PRICE - BigInt(1);
      
      await expect(
        searchPayment.connect(user1).payWithETH({ value: insufficientAmount })
      ).to.be.revertedWith("Insufficient ETH payment");
    });

    it("Should revert when ETH price is not set", async function () {
      await searchPayment.updateSearchPrice(0, 0); // Set ETH price to 0
      
      await expect(
        searchPayment.connect(user1).payWithETH({ value: INITIAL_ETH_PRICE })
      ).to.be.revertedWith("ETH search price not set");
    });
  });

  describe("USDC Payment", function () {
    it("Should allow payment with USDC", async function () {
      const tx = await searchPayment.connect(user1).payWithUSDC();
      
      await expect(tx)
        .to.emit(searchPayment, "PaymentReceived")
        .withArgs(user1.address, 1, INITIAL_USDC_PRICE, await getBlockTimestamp(), 1);
      
      expect(await searchPayment.userSearchesPurchased(user1.address)).to.equal(1);
      expect(await searchPayment.getUserTokenStats(user1.address, 1)).to.equal(INITIAL_USDC_PRICE);
    });

    it("Should revert with insufficient USDC balance", async function () {
      // User2 has no USDC tokens
      await expect(
        searchPayment.connect(user2).payWithUSDC()
      ).to.be.revertedWith("Insufficient USDC balance");
    });

    it("Should revert when USDC price is not set", async function () {
      await searchPayment.updateSearchPrice(1, 0); // Set USDC price to 0
      
      await expect(
        searchPayment.connect(user1).payWithUSDC()
      ).to.be.revertedWith("USDC search price not set");
    });
  });

  describe("PSP Payment", function () {
    it("Should allow payment with PSP tokens", async function () {
      const tx = await searchPayment.connect(user1).payWithPSP();
      
      await expect(tx)
        .to.emit(searchPayment, "PaymentReceived")
        .withArgs(user1.address, 2, INITIAL_PSP_PRICE, await getBlockTimestamp(), 1);
      
      expect(await searchPayment.userSearchesPurchased(user1.address)).to.equal(1);
      expect(await searchPayment.getUserTokenStats(user1.address, 2)).to.equal(INITIAL_PSP_PRICE);
    });

    it("Should allow legacy payment function", async function () {
      const tx = await searchPayment.connect(user1).payForSearch();
      
      await expect(tx)
        .to.emit(searchPayment, "PaymentReceived")
        .withArgs(user1.address, 2, INITIAL_PSP_PRICE, await getBlockTimestamp(), 1);
      
      expect(await searchPayment.userSearchesPurchased(user1.address)).to.equal(1);
    });

    it("Should revert with insufficient PSP balance", async function () {
      // User2 has no PSP tokens
      await expect(
        searchPayment.connect(user2).payWithPSP()
      ).to.be.revertedWith("Insufficient PSP token balance");
    });

    it("Should revert when PSP price is not set", async function () {
      await searchPayment.updateSearchPrice(2, 0); // Set PSP price to 0
      
      await expect(
        searchPayment.connect(user1).payWithPSP()
      ).to.be.revertedWith("PSP search price not set");
    });
  });

  describe("Price Management", function () {
    it("Should allow owner to update ETH price", async function () {
      const newPrice = ethers.parseEther("0.003");
      
      const tx = await searchPayment.updateSearchPrice(0, newPrice);
      await expect(tx)
        .to.emit(searchPayment, "PriceUpdated")
        .withArgs(0, INITIAL_ETH_PRICE, newPrice);
      
      expect(await searchPayment.getSearchPrice(0)).to.equal(newPrice);
    });

    it("Should allow owner to update USDC price", async function () {
      const newPrice = 6000000; // $6 in USDC
      
      await searchPayment.updateSearchPrice(1, newPrice);
      expect(await searchPayment.getSearchPrice(1)).to.equal(newPrice);
    });

    it("Should allow owner to update PSP price", async function () {
      const newPrice = ethers.parseEther("600");
      
      await searchPayment.updateSearchPrice(2, newPrice);
      expect(await searchPayment.getSearchPrice(2)).to.equal(newPrice);
    });

    it("Should allow legacy price update", async function () {
      const newPrice = ethers.parseEther("600");
      
      const tx = await searchPayment.updateSearchPriceLegacy(newPrice);
      await expect(tx)
        .to.emit(searchPayment, "PriceUpdated")
        .withArgs(2, INITIAL_PSP_PRICE, newPrice);
    });

    it("Should revert when non-owner tries to update price", async function () {
      await expect(
        searchPayment.connect(user1).updateSearchPrice(0, ethers.parseEther("0.003"))
      ).to.be.revertedWithCustomError(searchPayment, "OwnableUnauthorizedAccount");
    });

    it("Should revert when setting price to zero", async function () {
      await expect(
        searchPayment.updateSearchPrice(0, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should revert with invalid payment token", async function () {
      await expect(
        searchPayment.updateSearchPrice(99, ethers.parseEther("0.003"))
      ).to.be.revertedWith("Invalid payment token");
    });
  });

  describe("Token Address Management", function () {
    it("Should allow owner to update PSP token address", async function () {
      const newToken = user1.address; // Using address as mock
      
      const tx = await searchPayment.updateTokenAddress(2, newToken);
      await expect(tx)
        .to.emit(searchPayment, "TokenAddressUpdated")
        .withArgs(2, await pspToken.getAddress(), newToken);
    });

    it("Should allow owner to update USDC token address", async function () {
      const newToken = user1.address;
      
      await searchPayment.updateTokenAddress(1, newToken);
      
      const [, usdcAddress] = await searchPayment.getTokenAddresses();
      expect(usdcAddress).to.equal(newToken);
    });

    it("Should allow legacy PSP token update", async function () {
      const newToken = user1.address;
      
      const tx = await searchPayment.updatePSPToken(newToken);
      await expect(tx)
        .to.emit(searchPayment, "TokenAddressUpdated")
        .withArgs(2, await pspToken.getAddress(), newToken);
    });

    it("Should revert when updating ETH address", async function () {
      await expect(
        searchPayment.updateTokenAddress(0, user1.address)
      ).to.be.revertedWith("Cannot update ETH address");
    });

    it("Should revert with zero address", async function () {
      await expect(
        searchPayment.updateTokenAddress(2, ethers.ZeroAddress)
      ).to.be.revertedWith("Token address cannot be zero");
    });
  });

  describe("Withdrawal Functions", function () {
    beforeEach(async function () {
      // Make payments to add funds to contract
      await searchPayment.connect(user1).payWithETH({ value: INITIAL_ETH_PRICE });
      await searchPayment.connect(user1).payWithUSDC();
      await searchPayment.connect(user1).payWithPSP();
    });

    it("Should allow owner to withdraw ETH", async function () {
      const contractBalance = await ethers.provider.getBalance(await searchPayment.getAddress());
      
      const tx = await searchPayment.withdrawETH();
      await expect(tx)
        .to.emit(searchPayment, "TokensWithdrawn")
        .withArgs(owner.address, 0, contractBalance);
      
      expect(await ethers.provider.getBalance(await searchPayment.getAddress())).to.equal(0);
    });

    it("Should allow owner to withdraw USDC", async function () {
      const contractBalance = await usdcToken.balanceOf(await searchPayment.getAddress());
      
      const tx = await searchPayment.withdrawUSDC();
      await expect(tx)
        .to.emit(searchPayment, "TokensWithdrawn")
        .withArgs(owner.address, 1, contractBalance);
    });

    it("Should allow owner to withdraw PSP tokens", async function () {
      const contractBalance = await pspToken.balanceOf(await searchPayment.getAddress());
      
      const tx = await searchPayment.withdrawPSP();
      await expect(tx)
        .to.emit(searchPayment, "TokensWithdrawn")
        .withArgs(owner.address, 2, contractBalance);
    });

    it("Should allow legacy token withdrawal", async function () {
      await searchPayment.withdrawTokens();
      
      expect(await pspToken.balanceOf(await searchPayment.getAddress())).to.equal(0);
    });

    it("Should revert when non-owner tries to withdraw", async function () {
      await expect(
        searchPayment.connect(user1).withdrawETH()
      ).to.be.revertedWithCustomError(searchPayment, "OwnableUnauthorizedAccount");
    });

    it("Should revert when no funds to withdraw", async function () {
      // Withdraw first
      await searchPayment.withdrawETH();
      
      await expect(
        searchPayment.withdrawETH()
      ).to.be.revertedWith("No ETH to withdraw");
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause contract", async function () {
      await searchPayment.pause();
      expect(await searchPayment.paused()).to.be.true;
    });

    it("Should prevent payments when paused", async function () {
      await searchPayment.pause();
      
      await expect(
        searchPayment.connect(user1).payWithETH({ value: INITIAL_ETH_PRICE })
      ).to.be.revertedWithCustomError(searchPayment, "EnforcedPause");
      
      await expect(
        searchPayment.connect(user1).payWithUSDC()
      ).to.be.revertedWithCustomError(searchPayment, "EnforcedPause");
      
      await expect(
        searchPayment.connect(user1).payWithPSP()
      ).to.be.revertedWithCustomError(searchPayment, "EnforcedPause");
    });

    it("Should allow owner to unpause contract", async function () {
      await searchPayment.pause();
      await searchPayment.unpause();
      expect(await searchPayment.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause/unpause", async function () {
      await expect(
        searchPayment.connect(user1).pause()
      ).to.be.revertedWithCustomError(searchPayment, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await searchPayment.connect(user1).payWithETH({ value: INITIAL_ETH_PRICE });
      await searchPayment.connect(user1).payWithUSDC();
      await searchPayment.connect(user1).payWithPSP();
    });

    it("Should return correct user statistics", async function () {
      const [ethPaid, usdcPaid, pspPaid, searchesPurchased] = await searchPayment.getUserStats(user1.address);
      
      expect(ethPaid).to.equal(INITIAL_ETH_PRICE);
      expect(usdcPaid).to.equal(INITIAL_USDC_PRICE);
      expect(pspPaid).to.equal(INITIAL_PSP_PRICE);
      expect(searchesPurchased).to.equal(3);
    });

    it("Should return correct token balances", async function () {
      expect(await searchPayment.getTokenBalance(0)).to.equal(INITIAL_ETH_PRICE);
      expect(await searchPayment.getTokenBalance(1)).to.equal(INITIAL_USDC_PRICE);
      expect(await searchPayment.getTokenBalance(2)).to.equal(INITIAL_PSP_PRICE);
    });

    it("Should return legacy values correctly", async function () {
      expect(await searchPayment.getSearchPriceLegacy()).to.equal(INITIAL_PSP_PRICE);
      expect(await searchPayment.getTokenBalanceLegacy()).to.equal(INITIAL_PSP_PRICE);
      expect(await searchPayment.getPSPTokenAddress()).to.equal(await pspToken.getAddress());
    });

    it("Should return correct searches per payment", async function () {
      expect(await searchPayment.getSearchesPerPayment()).to.equal(1);
    });
  });

  describe("Multiple Payments and Statistics", function () {
    it("Should track multiple payments correctly", async function () {
      // Make multiple payments
      await searchPayment.connect(user1).payWithETH({ value: INITIAL_ETH_PRICE });
      await searchPayment.connect(user1).payWithETH({ value: INITIAL_ETH_PRICE });
      await searchPayment.connect(user1).payWithPSP();
      
      const [ethPaid, usdcPaid, pspPaid, searchesPurchased] = await searchPayment.getUserStats(user1.address);
      
      expect(ethPaid).to.equal(INITIAL_ETH_PRICE * BigInt(2));
      expect(usdcPaid).to.equal(0);
      expect(pspPaid).to.equal(INITIAL_PSP_PRICE);
      expect(searchesPurchased).to.equal(3);
    });

    it("Should track different users separately", async function () {
      // Give user2 some tokens
      await pspToken.transfer(user2.address, ethers.parseEther("1000"));
      await pspToken.connect(user2).approve(await searchPayment.getAddress(), ethers.parseEther("1000"));
      
      await searchPayment.connect(user1).payWithETH({ value: INITIAL_ETH_PRICE });
      await searchPayment.connect(user2).payWithPSP();
      
      expect(await searchPayment.userSearchesPurchased(user1.address)).to.equal(1);
      expect(await searchPayment.userSearchesPurchased(user2.address)).to.equal(1);
      
      expect(await searchPayment.getUserTokenStats(user1.address, 0)).to.equal(INITIAL_ETH_PRICE);
      expect(await searchPayment.getUserTokenStats(user2.address, 2)).to.equal(INITIAL_PSP_PRICE);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle exact payment amounts", async function () {
      await searchPayment.connect(user1).payWithETH({ value: INITIAL_ETH_PRICE });
      
      expect(await searchPayment.userSearchesPurchased(user1.address)).to.equal(1);
    });

    it("Should handle price updates correctly", async function () {
      const newETHPrice = ethers.parseEther("0.001");
      
      await searchPayment.updateSearchPrice(0, newETHPrice);
      await searchPayment.connect(user1).payWithETH({ value: newETHPrice });
      
      expect(await searchPayment.getUserTokenStats(user1.address, 0)).to.equal(newETHPrice);
    });

    it("Should return zero for invalid token balance", async function () {
      expect(await searchPayment.getTokenBalance(99)).to.equal(0);
    });

    it("Should return zero for invalid search price", async function () {
      expect(await searchPayment.getSearchPrice(99)).to.equal(0);
    });
  });

  // Helper function to get current block timestamp
  async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock('latest');
    return block.timestamp;
  }
});