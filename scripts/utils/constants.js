// Deployment constants and configurations

export const DEPLOYMENT_CONFIG = {
  // PSP Token Configuration
  PSP_TOKEN: {
    initialPrice: "0.000004", // 1 PSP = ~$0.01 at $2500/ETH
    totalSupply: "1000000",   // 1M initial supply
    maxSupply: "10000000",    // 10M max supply
    searchCost: "500"         // 500 PSP per search (~$5.00)
  },
  
  // Search Payment Configuration
  SEARCH_PAYMENT: {
    priceInETH: "0.002",      // $5 at $2500/ETH
    priceInUSDC: "5",         // $5 USDC
    priceInPSP: "500",        // 500 PSP tokens
    usdcMockAddress: "0x0000000000000000000000000000000000000001"
  },
  
  // Patent NFT Configuration
  PATENT_NFT: {
    name: "PatentNFT",
    symbol: "PNFT",
    mintingPrice: "0.1",      // 0.1 ETH per mint
    baseURI: ""               // Will be set via metadata service
  },
  
  // Marketplace Configuration
  MARKETPLACE: {
    platformFeePercent: 250,  // 2.5% (250 basis points)
    name: "Patent NFT Marketplace"
  }
};

// Network-specific configurations
export const NETWORK_CONFIG = {
  localhost: {
    name: "localhost",
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 31337,
    blockExplorer: "http://localhost:8545",
    gasPrice: "auto",
    accounts: {
      // ⚠️ Uses Hardhat's default test account #0 (publicly known, local testing ONLY)
      // This is the same account Hardhat provides automatically with 10,000 ETH
      // NEVER use this key for testnet or mainnet!
      deployer: process.env.LOCALHOST_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    }
  },
  
  sepolia: {
    name: "sepolia",
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    chainId: 11155111,
    blockExplorer: "https://sepolia.etherscan.io",
    gasPrice: "auto",
    accounts: {
      deployer: process.env.SEPOLIA_PRIVATE_KEY
    }
  },
  
  mainnet: {
    name: "mainnet",
    rpcUrl: process.env.MAINNET_RPC_URL,
    chainId: 1,
    blockExplorer: "https://etherscan.io",
    gasPrice: "auto",
    accounts: {
      deployer: process.env.MAINNET_PRIVATE_KEY
    }
  }
};

// Gas optimization settings
export const GAS_CONFIG = {
  optimizer: {
    enabled: true,
    runs: 200
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: 20
  }
};

// Contract verification settings
export const VERIFICATION_CONFIG = {
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  customChains: []
};

export default {
  DEPLOYMENT_CONFIG,
  NETWORK_CONFIG,
  GAS_CONFIG,
  VERIFICATION_CONFIG
};