# Patent NFT Marketplace

A decentralized marketplace for tokenizing and trading patents as NFTs on the Ethereum blockchain.

## Features

- Patent verification and validation
- NFT minting for patents
- Marketplace for buying and selling patent NFTs
- User profiles and wallet integration
- Patent search functionality

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Blockchain**: Ethereum, Solidity, Hardhat
- **Web3 Integration**: ethers.js, Web3.js

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MetaMask or another Ethereum wallet

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/patent-nft-marketplace.git
cd patent-nft-marketplace
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file based on `.env.example`
```bash
cp .env.example .env
```

4. Start the development server
```bash
npm run dev
```

### Smart Contract Development

1. Compile contracts
```bash
npm run compile
```

2. Run tests
```bash
npm run test
```

3. Start a local blockchain node
```bash
npm run node
```

4. Deploy contracts to local network
```bash
npm run deploy
```

## License

[MIT](LICENSE)