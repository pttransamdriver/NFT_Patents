const { ethers } = require("hardhat");

/**
 * Test helper utilities for Patent NFT Marketplace tests
 */

/**
 * Deploy all contracts for testing
 * @returns {Object} Deployed contract instances
 */
async function deployAllContracts() {
  const [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

  // Deploy PatentNFT
  const PatentNFT = await ethers.getContractFactory("PatentNFT");
  const patentNFT = await PatentNFT.deploy();
  await patentNFT.waitForDeployment();

  // Deploy PSPToken
  const PSP_TOKEN_PRICE = ethers.parseEther("0.00001"); // 0.00001 ETH per PSP
  const PSPToken = await ethers.getContractFactory("PSPToken");
  const pspToken = await PSPToken.deploy(PSP_TOKEN_PRICE);
  await pspToken.waitForDeployment();

  // Deploy Mock USDC
  const mockUSDC = await PSPToken.deploy(ethers.parseEther("0.001"));
  await mockUSDC.waitForDeployment();

  // Deploy SearchPayment
  const ETH_PRICE = ethers.parseEther("0.002");
  const USDC_PRICE = ethers.parseUnits("5", 6);
  const PSP_PRICE = ethers.parseEther("500");

  const SearchPayment = await ethers.getContractFactory("SearchPayment");
  const searchPayment = await SearchPayment.deploy(
    await pspToken.getAddress(),
    await mockUSDC.getAddress(),
    ETH_PRICE,
    USDC_PRICE,
    PSP_PRICE
  );
  await searchPayment.waitForDeployment();

  // Setup authorization
  await pspToken.setAuthorizedSpender(await searchPayment.getAddress(), true);

  return {
    patentNFT,
    pspToken,
    mockUSDC,
    searchPayment,
    owner,
    addr1,
    addr2,
    addrs,
    prices: {
      ETH_PRICE,
      USDC_PRICE,
      PSP_PRICE,
      PSP_TOKEN_PRICE
    }
  };
}

/**
 * Create sample patent data for testing
 * @param {string} recipient - Address to receive the NFT
 * @returns {Object} Patent data object
 */
function createSamplePatent(recipient) {
  return {
    recipient,
    tokenURI: "https://ipfs.io/ipfs/QmSampleHash123",
    title: "Advanced AI Patent System",
    inventor: "Dr. Jane Smith",
    patentNumber: `US-${Math.floor(Math.random() * 90000000) + 10000000}-B2`
  };
}

/**
 * Setup user with PSP tokens for testing
 * @param {Object} pspToken - PSP token contract instance
 * @param {Object} user - User signer
 * @param {string} ethAmount - Amount of ETH to spend on PSP tokens
 */
async function setupUserWithPSPTokens(pspToken, user, ethAmount = "0.1") {
  const ethAmountWei = ethers.parseEther(ethAmount);
  await pspToken.connect(user).purchaseTokens({ value: ethAmountWei });
  return await pspToken.balanceOf(user.address);
}

/**
 * Setup user with USDC tokens for testing
 * @param {Object} usdcToken - USDC token contract instance
 * @param {Object} user - User signer
 * @param {string} ethAmount - Amount of ETH to spend on USDC tokens
 */
async function setupUserWithUSDCTokens(usdcToken, user, ethAmount = "0.01") {
  const ethAmountWei = ethers.parseEther(ethAmount);
  await usdcToken.connect(user).purchaseTokens({ value: ethAmountWei });
  return await usdcToken.balanceOf(user.address);
}

/**
 * Approve tokens for spending
 * @param {Object} tokenContract - Token contract instance
 * @param {Object} user - User signer
 * @param {string} spender - Spender address
 * @param {string} amount - Amount to approve
 */
async function approveTokens(tokenContract, user, spender, amount) {
  const tx = await tokenContract.connect(user).approve(spender, amount);
  await tx.wait();
  return tx;
}

/**
 * Get gas cost for a transaction
 * @param {Object} tx - Transaction object
 * @returns {BigInt} Gas cost in wei
 */
async function getGasCost(tx) {
  const receipt = await tx.wait();
  return receipt.gasUsed * receipt.gasPrice;
}

/**
 * Expect transaction to emit event with specific args
 * @param {Promise} txPromise - Transaction promise
 * @param {Object} contract - Contract instance
 * @param {string} eventName - Event name
 * @param {Array} args - Expected event arguments
 */
async function expectEvent(txPromise, contract, eventName, args = []) {
  if (args.length > 0) {
    return expect(txPromise).to.emit(contract, eventName).withArgs(...args);
  } else {
    return expect(txPromise).to.emit(contract, eventName);
  }
}

/**
 * Fast forward time in the blockchain
 * @param {number} seconds - Seconds to fast forward
 */
async function fastForward(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine");
}

/**
 * Get current block timestamp
 * @returns {number} Current block timestamp
 */
async function getCurrentTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

/**
 * Convert wei to ether string
 * @param {BigInt} wei - Wei amount
 * @returns {string} Ether amount as string
 */
function weiToEther(wei) {
  return ethers.formatEther(wei);
}

/**
 * Convert ether to wei
 * @param {string} ether - Ether amount as string
 * @returns {BigInt} Wei amount
 */
function etherToWei(ether) {
  return ethers.parseEther(ether);
}

/**
 * Generate random address
 * @returns {string} Random Ethereum address
 */
function randomAddress() {
  return ethers.Wallet.createRandom().address;
}

/**
 * Check if address is valid
 * @param {string} address - Address to check
 * @returns {boolean} True if valid address
 */
function isValidAddress(address) {
  return ethers.isAddress(address);
}

/**
 * Common test constants
 */
const TEST_CONSTANTS = {
  ZERO_ADDRESS: ethers.ZeroAddress,
  MAX_UINT256: ethers.MaxUint256,
  SAMPLE_IPFS_HASH: "QmSampleHash123456789",
  SAMPLE_PATENT_NUMBERS: [
    "US-10123456-B2",
    "US-10234567-B2", 
    "US-10345678-B2",
    "US-10456789-B2",
    "US-10567890-B2"
  ],
  SAMPLE_INVENTORS: [
    "Dr. Alice Johnson",
    "Prof. Bob Smith", 
    "Dr. Carol Williams",
    "Prof. David Brown",
    "Dr. Eve Davis"
  ],
  SAMPLE_TITLES: [
    "Revolutionary AI Algorithm",
    "Advanced Quantum Computing Method",
    "Innovative Blockchain Protocol",
    "Next-Generation Neural Network",
    "Breakthrough Cryptographic System"
  ]
};

module.exports = {
  deployAllContracts,
  createSamplePatent,
  setupUserWithPSPTokens,
  setupUserWithUSDCTokens,
  approveTokens,
  getGasCost,
  expectEvent,
  fastForward,
  getCurrentTimestamp,
  weiToEther,
  etherToWei,
  randomAddress,
  isValidAddress,
  TEST_CONSTANTS
};
