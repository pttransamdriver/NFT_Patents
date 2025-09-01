import { expect } from "chai";
import { ethers } from "hardhat";

describe("PatentNFT", function () {
  let patentNFT;
  let owner, user1, user2, royaltyReceiver;
  
  const ROYALTY_FEE = 500; // 5%
  const TEST_PATENT_1 = "US1234567";
  const TEST_PATENT_2 = "US7654321";
  const TEST_URI_1 = "ipfs://QmTest1";
  const TEST_URI_2 = "ipfs://QmTest2";
  
  beforeEach(async function () {
    [owner, user1, user2, royaltyReceiver] = await ethers.getSigners();
    
    const PatentNFT = await ethers.getContractFactory("PatentNFT");
    patentNFT = await PatentNFT.deploy(royaltyReceiver.address, ROYALTY_FEE);
    await patentNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await patentNFT.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await patentNFT.name()).to.equal("PatentNFT");
      expect(await patentNFT.symbol()).to.equal("PAT");
    });

    it("Should set the correct royalty info", async function () {
      const [recipient, fee] = await patentNFT.royaltyInfo(1, 10000);
      expect(recipient).to.equal(royaltyReceiver.address);
      expect(fee).to.equal(ROYALTY_FEE);
    });
  });

  describe("Patent Minting", function () {
    it("Should allow owner to mint a patent NFT", async function () {
      const tx = await patentNFT.mintPatent(user1.address, TEST_PATENT_1, TEST_URI_1);
      await expect(tx)
        .to.emit(patentNFT, "PatentMinted")
        .withArgs(user1.address, 1, TEST_PATENT_1, TEST_URI_1);

      expect(await patentNFT.ownerOf(1)).to.equal(user1.address);
      expect(await patentNFT.tokenURI(1)).to.equal(TEST_URI_1);
      expect(await patentNFT.totalSupply()).to.equal(1);
    });

    it("Should not allow non-owner to mint patent NFT", async function () {
      await expect(
        patentNFT.connect(user1).mintPatent(user1.address, TEST_PATENT_1, TEST_URI_1)
      ).to.be.revertedWithCustomError(patentNFT, "OwnableUnauthorizedAccount");
    });

    it("Should prevent minting duplicate patents", async function () {
      await patentNFT.mintPatent(user1.address, TEST_PATENT_1, TEST_URI_1);
      
      await expect(
        patentNFT.mintPatent(user2.address, TEST_PATENT_1, TEST_URI_2)
      ).to.be.revertedWith("Patent already minted");
    });

    it("Should handle patent normalization correctly", async function () {
      // Test with spaces and lowercase
      await patentNFT.mintPatent(user1.address, "us 1234567", TEST_URI_1);
      
      // Should fail when trying to mint normalized version
      await expect(
        patentNFT.mintPatent(user2.address, "US1234567", TEST_URI_2)
      ).to.be.revertedWith("Patent already minted");
      
      // Should also fail with dashes
      await expect(
        patentNFT.mintPatent(user2.address, "US-1234567", TEST_URI_2)
      ).to.be.revertedWith("Patent already minted");
    });

    it("Should allow minting different patents", async function () {
      await patentNFT.mintPatent(user1.address, TEST_PATENT_1, TEST_URI_1);
      await patentNFT.mintPatent(user2.address, TEST_PATENT_2, TEST_URI_2);
      
      expect(await patentNFT.totalSupply()).to.equal(2);
      expect(await patentNFT.ownerOf(1)).to.equal(user1.address);
      expect(await patentNFT.ownerOf(2)).to.equal(user2.address);
    });
  });

  describe("Patent Existence Checking", function () {
    beforeEach(async function () {
      await patentNFT.mintPatent(user1.address, TEST_PATENT_1, TEST_URI_1);
    });

    it("Should return true for existing patent", async function () {
      expect(await patentNFT.patentExists(TEST_PATENT_1)).to.be.true;
    });

    it("Should return false for non-existing patent", async function () {
      expect(await patentNFT.patentExists(TEST_PATENT_2)).to.be.false;
    });

    it("Should return correct token ID for existing patent", async function () {
      expect(await patentNFT.patentTokenId(TEST_PATENT_1)).to.equal(1);
    });

    it("Should return 0 for non-existing patent token ID", async function () {
      expect(await patentNFT.patentTokenId(TEST_PATENT_2)).to.equal(0);
    });

    it("Should handle normalized patent checking", async function () {
      expect(await patentNFT.patentExists("us 1234567")).to.be.true;
      expect(await patentNFT.patentExists("US-1234567")).to.be.true;
      expect(await patentNFT.patentExists("us1234567")).to.be.true;
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      // Send some ETH to the contract
      await owner.sendTransaction({
        to: await patentNFT.getAddress(),
        value: ethers.parseEther("1.0")
      });
    });

    it("Should allow owner to withdraw ETH", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await patentNFT.getAddress());
      
      const tx = await patentNFT.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.equal(initialBalance + contractBalance - gasUsed);
      
      expect(await ethers.provider.getBalance(await patentNFT.getAddress())).to.equal(0);
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(
        patentNFT.connect(user1).withdraw()
      ).to.be.revertedWithCustomError(patentNFT, "OwnableUnauthorizedAccount");
    });

    it("Should revert if no funds to withdraw", async function () {
      // First withdraw all funds
      await patentNFT.withdraw();
      
      // Try to withdraw again
      await expect(patentNFT.withdraw()).to.be.revertedWith("No funds to withdraw");
    });
  });

  describe("ERC721 Functionality", function () {
    beforeEach(async function () {
      await patentNFT.mintPatent(user1.address, TEST_PATENT_1, TEST_URI_1);
    });

    it("Should support transfers", async function () {
      await patentNFT.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await patentNFT.ownerOf(1)).to.equal(user2.address);
    });

    it("Should support approvals", async function () {
      await patentNFT.connect(user1).approve(user2.address, 1);
      expect(await patentNFT.getApproved(1)).to.equal(user2.address);
    });

    it("Should support setApprovalForAll", async function () {
      await patentNFT.connect(user1).setApprovalForAll(user2.address, true);
      expect(await patentNFT.isApprovedForAll(user1.address, user2.address)).to.be.true;
    });

    it("Should return correct balance", async function () {
      expect(await patentNFT.balanceOf(user1.address)).to.equal(1);
      expect(await patentNFT.balanceOf(user2.address)).to.equal(0);
    });
  });

  describe("ERC721Enumerable Functionality", function () {
    beforeEach(async function () {
      await patentNFT.mintPatent(user1.address, TEST_PATENT_1, TEST_URI_1);
      await patentNFT.mintPatent(user1.address, TEST_PATENT_2, TEST_URI_2);
    });

    it("Should return correct total supply", async function () {
      expect(await patentNFT.totalSupply()).to.equal(2);
    });

    it("Should return token by index", async function () {
      expect(await patentNFT.tokenByIndex(0)).to.equal(1);
      expect(await patentNFT.tokenByIndex(1)).to.equal(2);
    });

    it("Should return token of owner by index", async function () {
      expect(await patentNFT.tokenOfOwnerByIndex(user1.address, 0)).to.equal(1);
      expect(await patentNFT.tokenOfOwnerByIndex(user1.address, 1)).to.equal(2);
    });
  });

  describe("Royalty (ERC2981) Functionality", function () {
    it("Should return correct royalty info", async function () {
      const salePrice = ethers.parseEther("10");
      const [recipient, royaltyAmount] = await patentNFT.royaltyInfo(1, salePrice);
      
      expect(recipient).to.equal(royaltyReceiver.address);
      expect(royaltyAmount).to.equal(salePrice * BigInt(ROYALTY_FEE) / BigInt(10000));
    });

    it("Should support ERC2981 interface", async function () {
      const ERC2981_INTERFACE_ID = "0x2a55205a";
      expect(await patentNFT.supportsInterface(ERC2981_INTERFACE_ID)).to.be.true;
    });
  });

  describe("Interface Support", function () {
    it("Should support ERC721 interface", async function () {
      const ERC721_INTERFACE_ID = "0x80ac58cd";
      expect(await patentNFT.supportsInterface(ERC721_INTERFACE_ID)).to.be.true;
    });

    it("Should support ERC721Enumerable interface", async function () {
      const ERC721_ENUMERABLE_INTERFACE_ID = "0x780e9d63";
      expect(await patentNFT.supportsInterface(ERC721_ENUMERABLE_INTERFACE_ID)).to.be.true;
    });

    it("Should support ERC721Metadata interface", async function () {
      const ERC721_METADATA_INTERFACE_ID = "0x5b5e139f";
      expect(await patentNFT.supportsInterface(ERC721_METADATA_INTERFACE_ID)).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very long patent numbers", async function () {
      const longPatent = "US" + "1".repeat(100);
      await patentNFT.mintPatent(user1.address, longPatent, TEST_URI_1);
      expect(await patentNFT.patentExists(longPatent)).to.be.true;
    });

    it("Should handle special characters in patent numbers", async function () {
      const specialPatent = "US123!@#$%^&*()456";
      await patentNFT.mintPatent(user1.address, specialPatent, TEST_URI_1);
      expect(await patentNFT.patentExists(specialPatent)).to.be.true;
    });
  });
});