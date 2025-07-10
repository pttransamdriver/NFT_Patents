import type { NFT, Patent, User } from '../types';

// Minimal staging dataset for testing core functionality
export const mockNFTs: NFT[] = [
  {
    id: '1',
    patentNumber: 'US-12325364-B1',
    title: 'Advanced Quantum Error Correction System',
    description: 'A revolutionary quantum error correction method that significantly reduces decoherence in quantum computing systems.',
    inventor: 'Dr. Sarah Chen, Prof. Michael Rodriguez',
    assignee: 'Quantum Dynamics Corporation',
    filingDate: '2023-03-15',
    category: 'Computing',
    status: 'active',
    price: 15.2,
    priceChange: 8.5,
    owner: '0x742d35Cc6634C0532925a3b8D1750d15DbfED4C6',
    creator: '0x742d35Cc6634C0532925a3b8D1750d15DbfED4C6',
    mintDate: '2024-01-15',
    isListed: true,
    views: 156,
    likes: 12,
    transactionHistory: [
      {
        id: 'tx1',
        type: 'mint',
        from: '0x0000000000000000000000000000000000000000',
        to: '0x742d35Cc6634C0532925a3b8D1750d15DbfED4C6',
        date: '2024-01-15',
        txHash: '0xabcd1234567890abcdef'
      }
    ]
  },
  {
    id: '2',
    patentNumber: 'US10,987,654',
    title: 'AI-Powered Medical Diagnostic System',
    description: 'Machine learning system for early detection of neurological disorders using brain scan analysis.',
    inventor: 'Dr. James Wilson, Dr. Emily Zhang',
    assignee: 'MedAI Corporation',
    filingDate: '2022-11-22',
    category: 'Healthcare',
    status: 'active',
    price: 8.5,
    priceChange: -1.2,
    owner: '0x456def789ghi012jkl345mno678pqr901stu234',
    creator: '0x456def789ghi012jkl345mno678pqr901stu234',
    mintDate: '2024-01-20',
    isListed: true,
    views: 89,
    likes: 7,
    transactionHistory: []
  },
  {
    id: '3',
    patentNumber: 'US11,234,567',
    title: 'Renewable Energy Storage System',
    description: 'Advanced battery technology for grid-scale renewable energy storage with 95% efficiency.',
    inventor: 'Dr. Lisa Johnson, Prof. Robert Kim',
    assignee: 'GreenTech Solutions',
    filingDate: '2023-06-10',
    category: 'Clean Energy',
    status: 'active',
    price: 12.8,
    priceChange: 5.3,
    owner: '0x742d35Cc6634C0532925a3b8D1750d15DbfED4C6',
    creator: '0x742d35Cc6634C0532925a3b8D1750d15DbfED4C6',
    mintDate: '2024-01-25',
    isListed: false,
    views: 234,
    likes: 18,
    transactionHistory: []
  }
];

// Minimal patent dataset for testing search and minting functionality
export const mockPatents: Patent[] = [
  {
    patentNumber: 'US-12325364-B1',
    title: 'Advanced Quantum Error Correction System',
    abstract: 'A revolutionary quantum error correction method that significantly reduces decoherence in quantum computing systems through novel stabilizer codes and real-time error detection.',
    inventors: ['Dr. Sarah Chen', 'Prof. Michael Rodriguez', 'Dr. James Wilson'],
    assignee: 'Quantum Dynamics Corporation',
    filingDate: '2023-03-15',
    publicationDate: '2023-09-15',
    status: 'active',
    category: 'Computing',
    claims: [
      'A quantum error correction system using stabilizer codes',
      'Real-time error detection and correction method',
      'Decoherence reduction technique for quantum systems'
    ],
    isAvailableForMinting: true
  },
  {
    patentNumber: 'US12345678',
    title: 'Revolutionary Water Purification System',
    abstract: 'A novel water purification method using nanotechnology filters that remove 99.99% of contaminants while preserving essential minerals.',
    inventors: ['Dr. Clean Water', 'Prof. Pure Science'],
    assignee: 'AquaTech Innovations',
    filingDate: '2023-08-15',
    publicationDate: '2024-02-15',
    status: 'active',
    category: 'Environmental',
    claims: [
      'A water purification system comprising nanoscale filtration membranes',
      'Method for selective removal of contaminants while preserving minerals',
      'Automated monitoring system for filter performance'
    ],
    isAvailableForMinting: true
  }
];

// Minimal user dataset for testing profile functionality
export const mockUsers: User[] = [
  {
    address: '0x742d35Cc6634C0532925a3b8D1750d15DbfED4C6',
    username: 'TestUser',
    ownedNFTs: ['1', '3'],
    listedNFTs: ['1'],
    totalVolume: 28.0,
    joinDate: '2024-01-01'
  },
  {
    address: '0x456def789ghi012jkl345mno678pqr901stu234',
    username: 'PatentCollector',
    ownedNFTs: ['2'],
    listedNFTs: ['2'],
    totalVolume: 8.5,
    joinDate: '2024-01-10'
  }
];