import { expect } from "chai";
import { ethers } from "hardhat";

describe("PSPToken", function () {
  let pspToken;
  let owner, user1, user2, authorizedSpender;
  
  const INITIAL_TOKEN_PRICE = ethers.parseEther("0.00002"); // $0.01 worth of ETH
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million PSP
  const MAX_SUPPLY = ethers.parseEther("10000000"); // 10 million PSP
  
  beforeEach(async function () {
    [owner, user1, user2, authorizedSpender] = await ethers.getSigners();
    
    const PSPToken = await ethers.getContractFactory("PSPToken");
    pspToken = await PSPToken.deploy(INITIAL_TOKEN_PRICE);
    await pspToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await pspToken.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await pspToken.name()).to.equal("Patent Search Pennies");
      expect(await pspToken.symbol()).to.equal("PSP");
    });

    it("Should set the correct initial token price", async function () {
      expect(await pspToken.tokenPriceInWei()).to.equal(INITIAL_TOKEN_PRICE);
    });

    it("Should mint initial supply to owner", async function () {
      expect(await pspToken.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await pspToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should set correct decimals", async function () {
      expect(await pspToken.decimals()).to.equal(18);
    });
  });

  describe("Token Purchase", function () {
    const purchaseAmount = ethers.parseEther("0.1"); // 0.1 ETH
    
    it("Should allow users to purchase tokens with ETH", async function () {
      const expectedTokens = (purchaseAmount * ethers.parseEther("1")) / INITIAL_TOKEN_PRICE;
      
      const tx = await pspToken.connect(user1).purchaseTokens({ value: purchaseAmount });
      
      await expect(tx)
        .to.emit(pspToken, "TokensPurchased")
        .withArgs(user1.address, expectedTokens, purchaseAmount);
      
      expect(await pspToken.balanceOf(user1.address)).to.equal(expectedTokens);
    });

    it("Should revert when sending 0 ETH", async function () {
      await expect(
        pspToken.connect(user1).purchaseTokens({ value: 0 })
      ).to.be.revertedWith("Must send ETH to purchase tokens");
    });

    it("Should revert when insufficient ETH for minimum token", async function () {
      await expect(
        pspToken.connect(user1).purchaseTokens({ value: 1 }) // 1 wei
      ).to.be.revertedWith("Insufficient ETH for minimum token purchase");
    });

    it("Should revert when purchase would exceed max supply", async function () {
      const massiveAmount = ethers.parseEther("1000000"); // Way too much ETH
      
      await expect(
        pspToken.connect(user1).purchaseTokens({ value: massiveAmount })
      ).to.be.revertedWith("Would exceed maximum token supply");
    });

    it("Should calculate correct token amount for ETH", async function () {
      const ethAmount = ethers.parseEther("0.05");
      const expectedTokens = (ethAmount * ethers.parseEther("1")) / INITIAL_TOKEN_PRICE;
      const calculatedTokens = await pspToken.calculateTokensForETH(ethAmount);
      
      expect(calculatedTokens).to.equal(expectedTokens);
    });
  });

  describe("Token Redemption", function () {
    const purchaseAmount = ethers.parseEther("0.1");
    const tokenAmount = ethers.parseEther("1000"); // 1000 PSP tokens
    
    beforeEach(async function () {
      // User purchases tokens first
      await pspToken.connect(user1).purchaseTokens({ value: purchaseAmount });
    });

    it("Should allow users to redeem tokens for ETH", async function () {
      const redeemAmount = ethers.parseEther("500"); // 500 PSP tokens
      const expectedETH = (redeemAmount * INITIAL_TOKEN_PRICE) / ethers.parseEther("1");
      
      const tx = await pspToken.connect(user1).redeemTokens(redeemAmount);
      
      await expect(tx)
        .to.emit(pspToken, "TokensRedeemed")
        .withArgs(user1.address, redeemAmount, expectedETH);
    });

    it("Should revert when redeeming 0 tokens", async function () {
      await expect(
        pspToken.connect(user1).redeemTokens(0)
      ).to.be.revertedWith("Must redeem positive amount");
    });

    it("Should revert when user has insufficient token balance", async function () {
      const tooManyTokens = ethers.parseEther("999999");
      
      await expect(
        pspToken.connect(user1).redeemTokens(tooManyTokens)
      ).to.be.revertedWith("Insufficient token balance");
    });

    it("Should revert when contract has insufficient ETH balance", async function () {
      // Owner withdraws all ETH first
      await pspToken.withdrawETH();
      
      await expect(
        pspToken.connect(user1).redeemTokens(ethers.parseEther("100"))
      ).to.be.revertedWith("Insufficient contract ETH balance");
    });

    it("Should calculate correct ETH amount for tokens", async function () {
      const tokenAmount = ethers.parseEther("1000");
      const expectedETH = (tokenAmount * INITIAL_TOKEN_PRICE) / ethers.parseEther("1");
      const calculatedETH = await pspToken.calculateETHForTokens(tokenAmount);
      
      expect(calculatedETH).to.equal(expectedETH);
    });
  });

  describe("Authorized Spenders", function () {
    const tokenAmount = ethers.parseEther("1000");
    
    beforeEach(async function () {
      // User purchases tokens and approves spender
      await pspToken.connect(user1).purchaseTokens({ value: ethers.parseEther("0.1") });
      await pspToken.connect(user1).approve(authorizedSpender.address, tokenAmount);
    });

    it("Should allow owner to set authorized spender", async function () {
      await pspToken.setAuthorizedSpender(authorizedSpender.address, true);
      expect(await pspToken.authorizedSpenders(authorizedSpender.address)).to.be.true;
    });

    it("Should allow authorized spender to spend tokens", async function () {
      await pspToken.setAuthorizedSpender(authorizedSpender.address, true);
      
      const initialBalance = await pspToken.balanceOf(user1.address);
      await pspToken.connect(authorizedSpender).spendTokensFor(user1.address, tokenAmount);
      
      expect(await pspToken.balanceOf(user1.address)).to.equal(initialBalance - tokenAmount);
    });

    it("Should revert when unauthorized address tries to spend tokens", async function () {
      await expect(
        pspToken.connect(user2).spendTokensFor(user1.address, tokenAmount)
      ).to.be.revertedWith("Not authorized to spend tokens");
    });

    it("Should allow owner to remove authorized spender", async function () {
      await pspToken.setAuthorizedSpender(authorizedSpender.address, true);
      await pspToken.setAuthorizedSpender(authorizedSpender.address, false);
      
      expect(await pspToken.authorizedSpenders(authorizedSpender.address)).to.be.false;
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update token price", async function () {
      const newPrice = ethers.parseEther("0.00003");
      
      const tx = await pspToken.updateTokenPrice(newPrice);
      await expect(tx)
        .to.emit(pspToken, "PriceUpdated")
        .withArgs(INITIAL_TOKEN_PRICE, newPrice);
      
      expect(await pspToken.tokenPriceInWei()).to.equal(newPrice);
    });

    it("Should revert when non-owner tries to update price", async function () {
      await expect(
        pspToken.connect(user1).updateTokenPrice(ethers.parseEther("0.00003"))
      ).to.be.revertedWithCustomError(pspToken, "OwnableUnauthorizedAccount");
    });

    it("Should revert when setting price to 0", async function () {
      await expect(
        pspToken.updateTokenPrice(0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should allow owner to mint additional tokens", async function () {
      const mintAmount = ethers.parseEther("100000");
      
      await pspToken.mint(user1.address, mintAmount);
      expect(await pspToken.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await pspToken.totalSupply()).to.equal(INITIAL_SUPPLY + mintAmount);
    });

    it("Should revert when minting would exceed max supply", async function () {
      const tooMuchToMint = MAX_SUPPLY; // This would exceed max supply
      
      await expect(
        pspToken.mint(user1.address, tooMuchToMint)
      ).to.be.revertedWith("Would exceed maximum supply");
    });

    it("Should allow owner to withdraw ETH", async function () {
      // User purchases tokens first to add ETH to contract
      await pspToken.connect(user1).purchaseTokens({ value: ethers.parseEther("0.1") });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await pspToken.getAddress());
      
      const tx = await pspToken.withdrawETH();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.equal(initialBalance + contractBalance - gasUsed);
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause contract", async function () {
      await pspToken.pause();
      expect(await pspToken.paused()).to.be.true;
    });

    it("Should prevent purchases when paused", async function () {
      await pspToken.pause();
      
      await expect(
        pspToken.connect(user1).purchaseTokens({ value: ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(pspToken, "EnforcedPause");
    });

    it("Should prevent redemptions when paused", async function () {
      // User purchases tokens first
      await pspToken.connect(user1).purchaseTokens({ value: ethers.parseEther("0.1") });
      
      await pspToken.pause();
      
      await expect(
        pspToken.connect(user1).redeemTokens(ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(pspToken, "EnforcedPause");
    });

    it("Should prevent transfers when paused", async function () {
      // Give user1 some tokens first
      await pspToken.transfer(user1.address, ethers.parseEther("1000"));
      
      await pspToken.pause();
      
      await expect(
        pspToken.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(pspToken, "EnforcedPause");
    });

    it("Should allow owner to unpause contract", async function () {
      await pspToken.pause();
      await pspToken.unpause();
      expect(await pspToken.paused()).to.be.false;
    });
  });

  describe("ERC20 Functionality", function () {
    beforeEach(async function () {
      // Transfer some tokens to user1 for testing
      await pspToken.transfer(user1.address, ethers.parseEther("1000"));
    });

    it("Should support standard transfers", async function () {
      const transferAmount = ethers.parseEther("100");
      
      await pspToken.connect(user1).transfer(user2.address, transferAmount);
      expect(await pspToken.balanceOf(user2.address)).to.equal(transferAmount);
      expect(await pspToken.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
    });

    it("Should support approvals and transferFrom", async function () {
      const approveAmount = ethers.parseEther("200");
      
      await pspToken.connect(user1).approve(user2.address, approveAmount);
      expect(await pspToken.allowance(user1.address, user2.address)).to.equal(approveAmount);
      
      await pspToken.connect(user2).transferFrom(user1.address, user2.address, approveAmount);
      expect(await pspToken.balanceOf(user2.address)).to.equal(approveAmount);
    });

    it("Should support burning tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      const initialSupply = await pspToken.totalSupply();
      
      await pspToken.connect(user1).burn(burnAmount);
      
      expect(await pspToken.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
      expect(await pspToken.totalSupply()).to.equal(initialSupply - burnAmount);
    });
  });

  describe("View Functions", function () {
    it("Should return correct token price", async function () {
      expect(await pspToken.getTokenPrice()).to.equal(INITIAL_TOKEN_PRICE);
    });

    it("Should return correct ETH balance", async function () {
      await pspToken.connect(user1).purchaseTokens({ value: ethers.parseEther("0.1") });
      expect(await pspToken.getETHBalance()).to.equal(ethers.parseEther("0.1"));
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small ETH purchases", async function () {
      const smallAmount = INITIAL_TOKEN_PRICE; // Exactly enough for 1 token
      
      await pspToken.connect(user1).purchaseTokens({ value: smallAmount });
      expect(await pspToken.balanceOf(user1.address)).to.equal(ethers.parseEther("1"));
    });

    it("Should handle maximum supply edge case", async function () {
      // Calculate exact amount that would reach max supply
      const currentSupply = await pspToken.totalSupply();
      const remainingSupply = MAX_SUPPLY - currentSupply;
      const ethNeeded = (remainingSupply * INITIAL_TOKEN_PRICE) / ethers.parseEther("1");
      
      // This should work
      await pspToken.connect(user1).purchaseTokens({ value: ethNeeded });
      expect(await pspToken.totalSupply()).to.equal(MAX_SUPPLY);
      
      // This should fail
      await expect(
        pspToken.connect(user2).purchaseTokens({ value: INITIAL_TOKEN_PRICE })
      ).to.be.revertedWith("Would exceed maximum token supply");
    });
  });
});