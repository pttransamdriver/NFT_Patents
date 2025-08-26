import { ethers } from "ethers";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Network configurations
export const NETWORKS = {
  localhost: {
    name: "localhost",
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 31337,
    privateKey: process.env.LOCALHOST_PRIVATE_KEY
  },
  sepolia: {
    name: "sepolia", 
    rpcUrl: process.env.SEPOLIA_RPC_URL,
    chainId: 11155111,
    privateKey: process.env.SEPOLIA_PRIVATE_KEY
  }
};

// Get deployment configuration
export function getDeploymentConfig(networkName) {
  const config = NETWORKS[networkName];
  if (!config) {
    throw new Error(`Unknown network: ${networkName}`);
  }
  
  if (!config.privateKey) {
    throw new Error(`Private key not configured for network: ${networkName}`);
  }
  
  return config;
}

// Create wallet and provider
export function createWallet(networkName) {
  const config = getDeploymentConfig(networkName);
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);
  
  return { provider, wallet, config };
}

// Save deployment result
export function saveDeployment(networkName, contractName, deploymentData) {
  const deploymentsDir = join(__dirname, "../../deployments", networkName);
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = join(deploymentsDir, `${contractName}.json`);
  const deployment = {
    contractName,
    address: deploymentData.address,
    transactionHash: deploymentData.deploymentTransaction?.hash,
    blockNumber: deploymentData.blockNumber,
    deploymentTime: new Date().toISOString(),
    network: networkName,
    deployer: deploymentData.deployer,
    constructorArgs: deploymentData.constructorArgs || [],
    ...deploymentData
  };
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log(`💾 ${contractName} deployment saved to: ${deploymentFile}`);
  
  return deployment;
}

// Load existing deployment
export function loadDeployment(networkName, contractName) {
  const deploymentFile = join(__dirname, "../../deployments", networkName, `${contractName}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    return null;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  return deployment;
}

// Update .env file with contract address
export function updateEnvFile(contractName, address) {
  const envPath = join(__dirname, "../../.env");
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }
  
  const envVarName = `VITE_${contractName.toUpperCase()}_ADDRESS`;
  const pattern = new RegExp(`^${envVarName}=.*$`, 'm');
  
  if (pattern.test(envContent)) {
    envContent = envContent.replace(pattern, `${envVarName}=${address}`);
  } else {
    envContent += `\n${envVarName}=${address}`;
  }
  
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log(`📝 Updated ${envVarName} in .env file`);
}

// Verify contract deployment
export async function verifyDeployment(provider, address, contractName) {
  try {
    const code = await provider.getCode(address);
    if (code === "0x") {
      throw new Error(`No contract deployed at ${address}`);
    }
    
    console.log(`✅ ${contractName} verified at: ${address}`);
    console.log(`📏 Contract bytecode size: ${(code.length - 2) / 2} bytes`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to verify ${contractName}:`, error.message);
    return false;
  }
}

// Get all deployments for a network
export function getAllDeployments(networkName) {
  const deploymentsDir = join(__dirname, "../../deployments", networkName);
  
  if (!fs.existsSync(deploymentsDir)) {
    return {};
  }
  
  const deployments = {};
  const files = fs.readdirSync(deploymentsDir);
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const contractName = file.replace('.json', '');
      const deployment = JSON.parse(fs.readFileSync(join(deploymentsDir, file), "utf8"));
      deployments[contractName] = deployment;
    }
  }
  
  return deployments;
}

// Display deployment summary
export function displayDeploymentSummary(deployments, networkName) {
  console.log(`\n🎉 Deployment Summary for ${networkName}:`);
  console.log("━".repeat(50));
  
  for (const [contractName, deployment] of Object.entries(deployments)) {
    console.log(`📦 ${contractName}:`);
    console.log(`   📍 Address: ${deployment.address}`);
    console.log(`   ⏰ Deployed: ${new Date(deployment.deploymentTime).toLocaleString()}`);
    console.log(`   👤 Deployer: ${deployment.deployer}`);
    if (deployment.transactionHash) {
      console.log(`   📃 TX Hash: ${deployment.transactionHash}`);
    }
    console.log("");
  }
}

// Check if contract needs redeployment
export async function needsRedeployment(provider, networkName, contractName, forceRedeploy = false) {
  if (forceRedeploy) {
    console.log(`🔄 Force redeployment requested for ${contractName}`);
    return true;
  }
  
  const existing = loadDeployment(networkName, contractName);
  if (!existing) {
    console.log(`🆕 ${contractName} not deployed yet`);
    return true;
  }
  
  const isVerified = await verifyDeployment(provider, existing.address, contractName);
  if (!isVerified) {
    console.log(`⚠️  ${contractName} deployment not verified, redeploying...`);
    return true;
  }
  
  console.log(`✅ ${contractName} already deployed at ${existing.address}`);
  return false;
}