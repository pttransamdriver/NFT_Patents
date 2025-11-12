import hre from 'hardhat';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🔧 Updating PatentNFT Base Metadata URI...\n');

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log('👤 Deployer:', deployer.address);

  // Get contract address
  const patentNFTAddress = process.env.VITE_PATENT_NFT_ADDRESS;
  if (!patentNFTAddress) {
    throw new Error('VITE_PATENT_NFT_ADDRESS not found in environment');
  }

  // New base URI (production backend)
  const newBaseURI = 'https://nft-patents-backend.vercel.app/api/nft/';

  console.log('📍 Contract Address:', patentNFTAddress);
  console.log('🔗 New Base URI:', newBaseURI);

  // Get contract instance
  const PatentNFT = await hre.ethers.getContractFactory('PatentNFT');
  const contract = PatentNFT.attach(patentNFTAddress);

  // Check current base URI
  try {
    const currentBaseURI = await contract.baseMetadataURI();
    console.log('📝 Current Base URI:', currentBaseURI);
  } catch (error) {
    console.log('⚠️  Could not read current base URI');
  }

  // Update base URI
  console.log('\n🚀 Updating base URI...');
  const tx = await contract.setBaseMetadataURI(newBaseURI);
  console.log('📤 Transaction sent:', tx.hash);

  // Wait for confirmation
  await tx.wait();
  console.log('✅ Base URI updated successfully!');

  // Verify the update
  const updatedBaseURI = await contract.baseMetadataURI();
  console.log('✓ Verified new base URI:', updatedBaseURI);

  console.log('\n🎉 All done! Your NFTs will now use the production backend URL.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
