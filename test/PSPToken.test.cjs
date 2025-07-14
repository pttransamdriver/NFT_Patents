const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PSPToken", function () {
  let pspToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  // Token parameters
  const INITIAL_TOKEN_PRICE = ethers.parseEther("0.00001"); // 0.00001 ETH per PSP (1 PSP = $0.01 at $1000/ETH)
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million PSP
  const MAX_SUPPLY = ethers.parseEther("10000000"); // 10 million PSP

  beforeEach(async function () {
    const PSPToken = await ethers.getContractFactory("PSPToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    pspToken = await PSPToken.deploy(INITIAL_TOKEN_PRICE);
    await pspToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await pspToken.owner()).to.equal(owner.address);
    });

    it("Should have correct token details", async function () {
      expect(await pspToken.name()).to.equal("Patent Search Pennies");
      expect(await pspToken.symbol()).to.equal("PSP");
      expect(await pspToken.decimals()).to.equal(18);
    });

    it("Should mint initial supply to owner", async function () {
      expect(await pspToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
      expect(await pspToken.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Should set correct token price", async function () {
      expect(await pspToken.tokenPriceInWei()).to.equal(INITIAL_TOKEN_PRICE);
    });

    it("Should not be paused initially", async function () {
      expect(await pspToken.paused()).to.equal(false);
    });
  });

  describe("Token Purchase", function () {
    it("Should allow users to purchase tokens with ETH", async function () {
      const ethAmount = ethers.parseEther("0.01"); // 0.01 ETH
      const expectedTokens = (ethAmount * ethers.parseEther("1")) / INITIAL_TOKEN_PRICE;

      await expect(pspToken.connect(addr1).purchaseTokens({ value: ethAmount }))
        .to.emit(pspToken, "TokensPurchased")
        .withArgs(addr1.address, expectedTokens, ethAmount);

      expect(await pspToken.balanceOf(addr1.address)).to.equal(expectedTokens);
    });

    it("Should calculate correct token amount for ETH", async function () {
      const ethAmount = ethers.parseEther("0.01");
      const expectedTokens = await pspToken.calculateTokensForETH(ethAmount);
      const calculatedTokens = (ethAmount * ethers.parseEther("1")) / INITIAL_TOKEN_PRICE;
      
      expect(expectedTokens).to.equal(calculatedTokens);
    });

    it("Should reject purchase with zero ETH", async function () {
      await expect(pspToken.connect(addr1).purchaseTokens({ value: 0 }))
        .to.be.revertedWith("Must send ETH to purchase tokens");
    });

    it("Should reject purchase when paused", async function () {
      await pspToken.pause();
      
      await expect(pspToken.connect(addr1).purchaseTokens({ value: ethers.parseEther("0.01") }))
        .to.be.revertedWithCustomError(pspToken, "EnforcedPause");
    });

    it("Should reject purchase that exceeds max supply", async function () {
      // Try to purchase more tokens than max supply allows
      const currentSupply = await pspToken.totalSupply();
      const remainingSupply = MAX_SUPPLY - currentSupply;
      const excessiveEthAmount = ((remainingSupply + ethers.parseEther("1")) * INITIAL_TOKEN_PRICE) / ethers.parseEther("1");

      await expect(pspToken.connect(addr1).purchaseTokens({ value: excessiveEthAmount }))
        .to.be.revertedWith("Would exceed maximum token supply");
    });
  });

  describe("Token Redemption", function () {
    beforeEach(async function () {
      // Give addr1 some tokens and ensure contract has ETH
      const ethAmount = ethers.parseEther("0.01");
      await pspToken.connect(addr1).purchaseTokens({ value: ethAmount });
    });

    it("Should allow users to redeem tokens for ETH", async function () {
      const tokenAmount = ethers.parseEther("100"); // 100 PSP tokens
      const expectedEth = (tokenAmount * INITIAL_TOKEN_PRICE) / ethers.parseEther("1");
      
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      
      await expect(pspToken.connect(addr1).redeemTokens(tokenAmount))
        .to.emit(pspToken, "TokensRedeemed")
        .withArgs(addr1.address, tokenAmount, expectedEth);

      // Check tokens were burned
      const userBalance = await pspToken.balanceOf(addr1.address);
      expect(userBalance).to.be.lt(ethers.parseEther("1000")); // Should be less than initial
    });

    it("Should calculate correct ETH amount for tokens", async function () {
      const tokenAmount = ethers.parseEther("100");
      const expectedEth = await pspToken.calculateETHForTokens(tokenAmount);
      const calculatedEth = (tokenAmount * INITIAL_TOKEN_PRICE) / ethers.parseEther("1");
      
      expect(expectedEth).to.equal(calculatedEth);
    });

    it("Should reject redemption with zero tokens", async function () {
      await expect(pspToken.connect(addr1).redeemTokens(0))
        .to.be.revertedWith("Must redeem positive amount");
    });

    it("Should reject redemption with insufficient balance", async function () {
      const userBalance = await pspToken.balanceOf(addr1.address);
      const excessiveAmount = userBalance + ethers.parseEther("1");

      await expect(pspToken.connect(addr1).redeemTokens(excessiveAmount))
        .to.be.revertedWith("Insufficient token balance");
    });

    it("Should reject redemption when contract has insufficient ETH", async function () {
      // Withdraw all ETH from contract
      await pspToken.withdrawETH();
      
      const tokenAmount = ethers.parseEther("10");
      await expect(pspToken.connect(addr1).redeemTokens(tokenAmount))
        .to.be.revertedWith("Insufficient contract ETH balance");
    });
  });

  describe("Authorized Spending", function () {
    let mockSpender;

    beforeEach(async function () {
      mockSpender = addr2.address;
      // Give addr1 some tokens
      await pspToken.connect(addr1).purchaseTokens({ value: ethers.parseEther("0.01") });
    });

    it("Should allow owner to set authorized spender", async function () {
      await pspToken.setAuthorizedSpender(mockSpender, true);
      expect(await pspToken.authorizedSpenders(mockSpender)).to.equal(true);
    });

    it("Should allow authorized spender to spend tokens", async function () {
      await pspToken.setAuthorizedSpender(mockSpender, true);
      
      const spendAmount = ethers.parseEther("50");
      const initialBalance = await pspToken.balanceOf(addr1.address);
      
      await pspToken.connect(addr2).spendTokensFor(addr1.address, spendAmount);
      
      const finalBalance = await pspToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance - spendAmount);
    });

    it("Should reject spending by unauthorized address", async function () {
      const spendAmount = ethers.parseEther("50");
      
      await expect(pspToken.connect(addr2).spendTokensFor(addr1.address, spendAmount))
        .to.be.revertedWith("Not authorized to spend tokens");
    });

    it("Should reject spending more than user balance", async function () {
      await pspToken.setAuthorizedSpender(mockSpender, true);
      
      const userBalance = await pspToken.balanceOf(addr1.address);
      const excessiveAmount = userBalance + ethers.parseEther("1");
      
      await expect(pspToken.connect(addr2).spendTokensFor(addr1.address, excessiveAmount))
        .to.be.revertedWith("Insufficient user token balance");
    });

    it("Should allow owner to revoke authorization", async function () {
      await pspToken.setAuthorizedSpender(mockSpender, true);
      await pspToken.setAuthorizedSpender(mockSpender, false);
      
      expect(await pspToken.authorizedSpenders(mockSpender)).to.equal(false);
      
      const spendAmount = ethers.parseEther("50");
      await expect(pspToken.connect(addr2).spendTokensFor(addr1.address, spendAmount))
        .to.be.revertedWith("Not authorized to spend tokens");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update token price", async function () {
      const newPrice = ethers.parseEther("0.00002");
      
      await expect(pspToken.updateTokenPrice(newPrice))
        .to.emit(pspToken, "PriceUpdated")
        .withArgs(INITIAL_TOKEN_PRICE, newPrice);
      
      expect(await pspToken.tokenPriceInWei()).to.equal(newPrice);
    });

    it("Should reject price update by non-owner", async function () {
      const newPrice = ethers.parseEther("0.00002");
      
      await expect(pspToken.connect(addr1).updateTokenPrice(newPrice))
        .to.be.revertedWithCustomError(pspToken, "OwnableUnauthorizedAccount");
    });

    it("Should reject zero price update", async function () {
      await expect(pspToken.updateTokenPrice(0))
        .to.be.revertedWith("Price must be greater than 0");
    });

    it("Should allow owner to mint additional tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      const initialSupply = await pspToken.totalSupply();
      
      await pspToken.mint(addr1.address, mintAmount);
      
      expect(await pspToken.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await pspToken.totalSupply()).to.equal(initialSupply + mintAmount);
    });

    it("Should reject minting that exceeds max supply", async function () {
      const currentSupply = await pspToken.totalSupply();
      const excessiveAmount = MAX_SUPPLY - currentSupply + ethers.parseEther("1");
      
      await expect(pspToken.mint(addr1.address, excessiveAmount))
        .to.be.revertedWith("Would exceed maximum supply");
    });

    it("Should allow owner to withdraw ETH", async function () {
      // Add some ETH to contract
      await pspToken.connect(addr1).purchaseTokens({ value: ethers.parseEther("0.01") });
      
      const contractBalance = await ethers.provider.getBalance(await pspToken.getAddress());
      const ownerInitialBalance = await ethers.provider.getBalance(owner.address);
      
      await pspToken.withdrawETH();
      
      expect(await ethers.provider.getBalance(await pspToken.getAddress())).to.equal(0);
    });

    it("Should reject ETH withdrawal when no balance", async function () {
      await expect(pspToken.withdrawETH())
        .to.be.revertedWith("No ETH to withdraw");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause and unpause", async function () {
      await pspToken.pause();
      expect(await pspToken.paused()).to.equal(true);
      
      await pspToken.unpause();
      expect(await pspToken.paused()).to.equal(false);
    });

    it("Should prevent transfers when paused", async function () {
      // Give addr1 some tokens first
      await pspToken.connect(addr1).purchaseTokens({ value: ethers.parseEther("0.01") });
      
      await pspToken.pause();
      
      await expect(pspToken.connect(addr1).transfer(addr2.address, ethers.parseEther("10")))
        .to.be.revertedWithCustomError(pspToken, "EnforcedPause");
    });

    it("Should prevent purchases when paused", async function () {
      await pspToken.pause();
      
      await expect(pspToken.connect(addr1).purchaseTokens({ value: ethers.parseEther("0.01") }))
        .to.be.revertedWithCustomError(pspToken, "EnforcedPause");
    });

    it("Should prevent redemptions when paused", async function () {
      // Give addr1 some tokens first
      await pspToken.connect(addr1).purchaseTokens({ value: ethers.parseEther("0.01") });
      
      await pspToken.pause();
      
      await expect(pspToken.connect(addr1).redeemTokens(ethers.parseEther("10")))
        .to.be.revertedWithCustomError(pspToken, "EnforcedPause");
    });
  });

  describe("View Functions", function () {
    it("Should return correct token price", async function () {
      expect(await pspToken.getTokenPrice()).to.equal(INITIAL_TOKEN_PRICE);
    });

    it("Should return correct ETH balance", async function () {
      const ethAmount = ethers.parseEther("0.01");
      await pspToken.connect(addr1).purchaseTokens({ value: ethAmount });
      
      expect(await pspToken.getETHBalance()).to.equal(ethAmount);
    });

    it("Should calculate tokens for ETH correctly", async function () {
      const ethAmount = ethers.parseEther("0.01");
      const expectedTokens = (ethAmount * ethers.parseEther("1")) / INITIAL_TOKEN_PRICE;
      
      expect(await pspToken.calculateTokensForETH(ethAmount)).to.equal(expectedTokens);
    });

    it("Should calculate ETH for tokens correctly", async function () {
      const tokenAmount = ethers.parseEther("100");
      const expectedEth = (tokenAmount * INITIAL_TOKEN_PRICE) / ethers.parseEther("1");
      
      expect(await pspToken.calculateETHForTokens(tokenAmount)).to.equal(expectedEth);
    });
  });
});
