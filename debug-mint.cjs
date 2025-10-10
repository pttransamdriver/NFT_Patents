const { ethers } = require('hardhat');

async function debugMinting() {
  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt('PatentNFT', '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0');
  
  console.log('=== Contract Debug Info ===');
  console.log('Contract address:', contract.target);
  console.log('Contract owner:', await contract.owner());
  console.log('Minting price:', ethers.formatEther(await contract.mintingPrice()), 'ETH');
  console.log('Signer address:', signer.address);
  console.log('Signer balance:', ethers.formatEther(await ethers.provider.getBalance(signer.address)), 'ETH');
  
  // Check if patent already exists
  const patentNumber = 'TR2022010517U5';
  console.log('Patent', patentNumber, 'already exists:', await contract.patentExists(patentNumber));
  
  console.log('\n=== Testing Minting ===');
  try {
    // Test gas estimation
    const recipient = signer.address;
    const value = ethers.parseEther('0.1');
    
    console.log('Attempting to estimate gas for:');
    console.log('- Recipient:', recipient);
    console.log('- Patent Number:', patentNumber);
    console.log('- Value:', ethers.formatEther(value), 'ETH');
    
    const gasEstimate = await contract.mintPatentNFT.estimateGas(recipient, patentNumber, { value });
    console.log('Gas estimate:', gasEstimate.toString());
    
    // If gas estimation works, try the actual call
    const tx = await contract.mintPatentNFT(recipient, patentNumber, { value });
    console.log('Transaction hash:', tx.hash);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Try to get more specific error info
    if (error.data) {
      console.log('Error data:', error.data);
    }
    
    // Test individual conditions
    console.log('\n=== Debugging Individual Conditions ===');
    
    // Check payment amount
    const mintingPrice = await contract.mintingPrice();
    const paymentAmount = ethers.parseEther('0.1');
    console.log('Required payment:', ethers.formatEther(mintingPrice), 'ETH');
    console.log('Sending payment:', ethers.formatEther(paymentAmount), 'ETH');
    console.log('Payment sufficient:', paymentAmount >= mintingPrice);
    
    // Check patent existence
    console.log('Patent exists check:', await contract.patentExists(patentNumber));
    
    // Check recipient address
    console.log('Recipient address valid:', signer.address !== ethers.ZeroAddress);
    
    // Check patent number length
    console.log('Patent number length:', patentNumber.length);
    console.log('Patent number valid:', patentNumber.length > 0);
  }
}

debugMinting().catch(console.error);