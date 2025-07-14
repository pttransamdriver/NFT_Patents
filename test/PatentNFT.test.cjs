const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PatentNFT", function () {
  let patentNFT;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    const PatentNFT = await ethers.getContractFactory("PatentNFT");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy the contract
    patentNFT = await PatentNFT.deploy();
    await patentNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await patentNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await patentNFT.name()).to.equal("PatentNFT");
      expect(await patentNFT.symbol()).to.equal("PNFT");
    });
  });

  describe("Patent Minting", function () {
    const samplePatent = {
      recipient: null, // Will be set in tests
      tokenURI: "https://ipfs.io/ipfs/QmSampleHash",
      title: "Revolutionary AI Algorithm",
      inventor: "Dr. Jane Smith",
      patentNumber: "US-12345678-B2"
    };

    beforeEach(function () {
      samplePatent.recipient = addr1.address;
    });

    it("Should mint a patent NFT successfully", async function () {
      const tx = await patentNFT.mintPatent(
        samplePatent.recipient,
        samplePatent.tokenURI,
        samplePatent.title,
        samplePatent.inventor,
        samplePatent.patentNumber
      );

      const receipt = await tx.wait();
      const tokenId = 1; // First token should have ID 1

      // Check ownership
      expect(await patentNFT.ownerOf(tokenId)).to.equal(samplePatent.recipient);
      
      // Check token URI
      expect(await patentNFT.tokenURI(tokenId)).to.equal(samplePatent.tokenURI);
      
      // Check patent data
      const patent = await patentNFT.getPatent(tokenId);
      expect(patent.title).to.equal(samplePatent.title);
      expect(patent.inventor).to.equal(samplePatent.inventor);
      expect(patent.patentNumber).to.equal(samplePatent.patentNumber);
      expect(patent.isVerified).to.equal(false);
    });

    it("Should emit PatentMinted event", async function () {
      await expect(patentNFT.mintPatent(
        samplePatent.recipient,
        samplePatent.tokenURI,
        samplePatent.title,
        samplePatent.inventor,
        samplePatent.patentNumber
      ))
        .to.emit(patentNFT, "PatentMinted")
        .withArgs(1, samplePatent.recipient, samplePatent.patentNumber);
    });

    it("Should increment token IDs correctly", async function () {
      // Mint first patent
      await patentNFT.mintPatent(
        samplePatent.recipient,
        samplePatent.tokenURI,
        samplePatent.title,
        samplePatent.inventor,
        samplePatent.patentNumber
      );

      // Mint second patent
      await patentNFT.mintPatent(
        addr2.address,
        "https://ipfs.io/ipfs/QmAnotherHash",
        "Another Innovation",
        "Dr. John Doe",
        "US-87654321-B2"
      );

      expect(await patentNFT.ownerOf(1)).to.equal(samplePatent.recipient);
      expect(await patentNFT.ownerOf(2)).to.equal(addr2.address);
    });

    describe("Input Validation", function () {
      it("Should reject zero address recipient", async function () {
        await expect(patentNFT.mintPatent(
          ethers.ZeroAddress,
          samplePatent.tokenURI,
          samplePatent.title,
          samplePatent.inventor,
          samplePatent.patentNumber
        )).to.be.revertedWith("Invalid recipient address");
      });

      it("Should reject empty token URI", async function () {
        await expect(patentNFT.mintPatent(
          samplePatent.recipient,
          "",
          samplePatent.title,
          samplePatent.inventor,
          samplePatent.patentNumber
        )).to.be.revertedWith("Token URI required");
      });

      it("Should reject empty title", async function () {
        await expect(patentNFT.mintPatent(
          samplePatent.recipient,
          samplePatent.tokenURI,
          "",
          samplePatent.inventor,
          samplePatent.patentNumber
        )).to.be.revertedWith("Title required");
      });

      it("Should reject empty inventor", async function () {
        await expect(patentNFT.mintPatent(
          samplePatent.recipient,
          samplePatent.tokenURI,
          samplePatent.title,
          "",
          samplePatent.patentNumber
        )).to.be.revertedWith("Inventor required");
      });

      it("Should reject empty patent number", async function () {
        await expect(patentNFT.mintPatent(
          samplePatent.recipient,
          samplePatent.tokenURI,
          samplePatent.title,
          samplePatent.inventor,
          ""
        )).to.be.revertedWith("Patent number required");
      });
    });
  });

  describe("Patent Verification", function () {
    let tokenId;

    beforeEach(async function () {
      // Mint a patent first
      const tx = await patentNFT.mintPatent(
        addr1.address,
        "https://ipfs.io/ipfs/QmSampleHash",
        "Test Patent",
        "Test Inventor",
        "US-12345678-B2"
      );
      await tx.wait();
      tokenId = 1;
    });

    it("Should allow owner to verify patent", async function () {
      await patentNFT.verifyPatent(tokenId);
      
      const patent = await patentNFT.getPatent(tokenId);
      expect(patent.isVerified).to.equal(true);
    });

    it("Should emit PatentVerified event", async function () {
      await expect(patentNFT.verifyPatent(tokenId))
        .to.emit(patentNFT, "PatentVerified")
        .withArgs(tokenId, "US-12345678-B2");
    });

    it("Should reject verification by non-owner", async function () {
      await expect(patentNFT.connect(addr1).verifyPatent(tokenId))
        .to.be.revertedWithCustomError(patentNFT, "OwnableUnauthorizedAccount");
    });

    it("Should reject verification of non-existent patent", async function () {
      await expect(patentNFT.verifyPatent(999))
        .to.be.revertedWith("Patent does not exist");
    });
  });

  describe("Patent Data Retrieval", function () {
    let tokenId;
    const patentData = {
      title: "Advanced Quantum Computing",
      inventor: "Dr. Alice Johnson",
      patentNumber: "US-11111111-B2"
    };

    beforeEach(async function () {
      const tx = await patentNFT.mintPatent(
        addr1.address,
        "https://ipfs.io/ipfs/QmTestHash",
        patentData.title,
        patentData.inventor,
        patentData.patentNumber
      );
      await tx.wait();
      tokenId = 1;
    });

    it("Should return correct patent data", async function () {
      const patent = await patentNFT.getPatent(tokenId);
      
      expect(patent.title).to.equal(patentData.title);
      expect(patent.inventor).to.equal(patentData.inventor);
      expect(patent.patentNumber).to.equal(patentData.patentNumber);
      expect(patent.isVerified).to.equal(false);
      expect(patent.filingDate).to.be.gt(0); // Should have a timestamp
    });

    it("Should reject query for non-existent patent", async function () {
      await expect(patentNFT.getPatent(999))
        .to.be.revertedWith("Patent does not exist");
    });
  });

  describe("Patent Number Validation", function () {
    it("Should accept valid patent number format", async function () {
      // This test assumes the current simple validation
      // In production, you'd want more sophisticated validation
      await expect(patentNFT.mintPatent(
        addr1.address,
        "https://ipfs.io/ipfs/QmTestHash",
        "Test Patent",
        "Test Inventor",
        "US-12345678-B2"
      )).to.not.be.reverted;
    });

    it("Should reject empty patent number", async function () {
      await expect(patentNFT.mintPatent(
        addr1.address,
        "https://ipfs.io/ipfs/QmTestHash",
        "Test Patent",
        "Test Inventor",
        ""
      )).to.be.revertedWith("Patent number required");
    });
  });

  describe("Access Control", function () {
    it("Should have correct owner", async function () {
      expect(await patentNFT.owner()).to.equal(owner.address);
    });

    it("Should allow owner to verify patents", async function () {
      // Mint a patent first
      await patentNFT.mintPatent(
        addr1.address,
        "https://ipfs.io/ipfs/QmTestHash",
        "Test Patent",
        "Test Inventor",
        "US-12345678-B2"
      );

      // Owner should be able to verify
      await expect(patentNFT.verifyPatent(1)).to.not.be.reverted;
    });

    it("Should prevent non-owner from verifying patents", async function () {
      // Mint a patent first
      await patentNFT.mintPatent(
        addr1.address,
        "https://ipfs.io/ipfs/QmTestHash",
        "Test Patent",
        "Test Inventor",
        "US-12345678-B2"
      );

      // Non-owner should not be able to verify
      await expect(patentNFT.connect(addr1).verifyPatent(1))
        .to.be.revertedWithCustomError(patentNFT, "OwnableUnauthorizedAccount");
    });
  });
});
