import hre from 'hardhat';
import { ethers } from 'ethers';

async function main() {
  console.log('🔍 Testing PatentNFT contract on Sepolia...\n');

  const contractAddress = process.env.VITE_PATENT_NFT_ADDRESS || '0x2ff6C8e359D2C7762C0197E512A48Bf1D96758cB';
  const patentNumber = 'GB189626338A';
  const ipfsHash = 'QmevcChaDwa1rpx1rNa5gNFCcSYjhRTv9r5WWELKSMEjNG';

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log('📝 Signer address:', signer.address);
  console.log('💰 Balance:', ethers.formatEther(await hre.ethers.provider.getBalance(signer.address)), 'ETH\n');

  // Connect to contract
  const PatentNFT = await hre.ethers.getContractAt('PatentNFT', contractAddress);
  console.log('📄 Contract address:', contractAddress);

  // Check contract state
  try {
    const mintingPrice = await PatentNFT.getMintingPrice();
    console.log('💵 Minting price:', ethers.formatEther(mintingPrice), 'ETH');

    const owner = await PatentNFT.owner();
    console.log('👤 Contract owner:', owner);

    const exists = await PatentNFT.patentExists(patentNumber);
    console.log('🔍 Patent already minted:', exists);
  } catch (error) {
    console.error('❌ Error checking contract state:', error.message);
    return;
  }

  // Try to estimate gas for minting
  console.log('\n🧪 Attempting to estimate gas for minting...');
  try {
    const gasEstimate = await PatentNFT.mintPatentNFT.estimateGas(
      signer.address,
      patentNumber,
      ipfsHash,
      { value: ethers.parseEther('0.05') }
    );
    console.log('✅ Gas estimate:', gasEstimate.toString());
  } catch (error) {
    console.error('❌ Gas estimation failed!');
    console.error('Error code:', error.code);
    console.error('Error reason:', error.reason);
    console.error('Error message:', error.message);

    // Try to get more details
    if (error.data) {
      console.error('Error data:', error.data);
    }

    console.log('\n🔍 Checking possible issues:');

    // Check if patent exists
    const patentExists = await PatentNFT.patentExists(patentNumber);
    console.log('  - Patent exists:', patentExists);

    // Check minting price
    const price = await PatentNFT.getMintingPrice();
    console.log('  - Minting price:', ethers.formatEther(price), 'ETH');
    console.log('  - Value sent:', ethers.formatEther(ethers.parseEther('0.05')), 'ETH');
    console.log('  - Sufficient payment:', ethers.parseEther('0.05') >= price);

    // Check IPFS hash
    console.log('  - IPFS hash length:', ipfsHash.length);
    console.log('  - IPFS hash empty:', ipfsHash.length === 0);
    console.log('  - IPFS hash format:', ipfsHash.startsWith('Qm') ? 'CIDv0' : 'Other');

    // Check patent number
    console.log('  - Patent number:', patentNumber);
    console.log('  - Patent number length:', patentNumber.length);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
