import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.20",
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    // Add Ethereum mainnet configuration when ready for deployment
    // mainnet: {
    //   url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    //   accounts: [process.env.PRIVATE_KEY]
    // },
    // Add testnet configuration
    // goerli: {
    //   url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
    //   accounts: [process.env.PRIVATE_KEY]
    // }
  }
};

export default config;