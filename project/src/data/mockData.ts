import type { NFT, Patent, User } from '../types';

export const mockNFTs: NFT[] = [
  {
    id: '1',
    patentNumber: 'US10,123,456',
    title: 'Advanced Solar Cell Technology with Quantum Dot Enhancement',
    description: 'Revolutionary solar cell technology that uses quantum dots to achieve 45% efficiency in energy conversion.',
    inventor: 'Dr. Sarah Chen, Prof. Michael Rodriguez',
    assignee: 'SolarTech Innovations Inc.',
    filingDate: '2021-03-15',
    category: 'Clean Energy',
    status: 'active',
    price: 12.5,
    priceChange: 15.3,
    owner: '0x742d35Cc6634C0532925a3b8D1750d15DbfED4C6',
    creator: '0x123abc456def789ghi012jkl345mno678pqr901',
    mintDate: '2023-08-10',
    isListed: true,
    views: 1247,
    likes: 89,
    transactionHistory: [
      {
        id: 'tx1',
        type: 'mint',
        from: '0x0000000000000000000000000000000000000000',
        to: '0x123abc456def789ghi012jkl345mno678pqr901',
        date: '2023-08-10',
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
    filingDate: '2020-11-22',
    category: 'Healthcare',
    status: 'active',
    price: 8.3,
    priceChange: -2.1,
    owner: '0x456def789ghi012jkl345mno678pqr901stu234',
    creator: '0x789ghi012jkl345mno678pqr901stu234vwx567',
    mintDate: '2023-09-15',
    isListed: true,
    views: 892,
    likes: 64,
    transactionHistory: []
  },
  {
    id: '3',
    patentNumber: 'US11,234,567',
    title: 'Autonomous Vehicle Navigation Algorithm',
    description: 'Advanced pathfinding algorithm for self-driving vehicles in complex urban environments.',
    inventor: 'Dr. Robert Kim, Dr. Lisa Johnson',
    assignee: 'AutoDrive Technologies',
    filingDate: '2022-01-10',
    category: 'Transportation',
    status: 'active',
    price: 18.7,
    priceChange: 7.8,
    owner: '0x890abc123def456ghi789jkl012mno345pqr678',
    creator: '0x234def567ghi890jkl123mno456pqr789stu012',
    mintDate: '2023-10-02',
    isListed: false,
    views: 2156,
    likes: 134,
    transactionHistory: []
  },
  {
    id: '4',
    patentNumber: 'US10,765,432',
    title: 'Quantum Computing Error Correction Method',
    description: 'Novel approach to quantum error correction that reduces decoherence by 90%.',
    inventor: 'Prof. Alan Turing Jr., Dr. Marie Curie Smith',
    assignee: 'Quantum Dynamics Lab',
    filingDate: '2021-07-08',
    category: 'Computing',
    status: 'active',
    price: 25.2,
    priceChange: 22.5,
    owner: '0x345ghi678jkl901mno234pqr567stu890vwx123',
    creator: '0x678jkl901mno234pqr567stu890vwx123yza456',
    mintDate: '2023-11-20',
    isListed: true,
    views: 3421,
    likes: 278,
    transactionHistory: []
  },
  {
    id: '5',
    patentNumber: 'US11,456,789',
    title: 'Biodegradable Plastic Manufacturing Process',
    description: 'Environmentally friendly plastic production method using algae-based polymers.',
    inventor: 'Dr. Green Earth, Prof. Eco Friendly',
    assignee: 'BioPlastics Inc.',
    filingDate: '2022-05-20',
    category: 'Materials',
    status: 'active',
    price: 6.8,
    priceChange: 3.2,
    owner: '0x567jkl890mno123pqr456stu789vwx012yza345',
    creator: '0x890mno123pqr456stu789vwx012yza345bcd678',
    mintDate: '2023-12-05',
    isListed: true,
    views: 756,
    likes: 45,
    transactionHistory: []
  },
  {
    id: '6',
    patentNumber: 'US10,654,321',
    title: 'Advanced Battery Technology for Electric Vehicles',
    description: 'Lithium-silicon battery design with 3x capacity and 50% faster charging.',
    inventor: 'Dr. Power Cell, Dr. Energy Storage',
    assignee: 'ElectroBatt Solutions',
    filingDate: '2021-09-14',
    category: 'Energy Storage',
    status: 'active',
    price: 14.6,
    priceChange: 9.1,
    owner: '0x123pqr456stu789vwx012yza345bcd678efg901',
    creator: '0x456stu789vwx012yza345bcd678efg901hij234',
    mintDate: '2024-01-12',
    isListed: true,
    views: 1876,
    likes: 112,
    transactionHistory: []
  }
];

export const mockPatents: Patent[] = [
  {
    patentNumber: 'US11,789,012',
    title: 'Revolutionary Water Purification System',
    abstract: 'A novel water purification method using nanotechnology filters that remove 99.99% of contaminants while preserving essential minerals.',
    inventors: ['Dr. Clean Water', 'Prof. Pure Science'],
    assignee: 'AquaTech Innovations',
    filingDate: '2022-08-15',
    publicationDate: '2023-02-15',
    status: 'active',
    category: 'Environmental',
    claims: [
      'A water purification system comprising nanoscale filtration membranes',
      'Method for selective removal of contaminants while preserving minerals',
      'Automated monitoring system for filter performance'
    ],
    isAvailableForMinting: true
  },
  {
    patentNumber: 'US11,345,678',
    title: 'Wireless Power Transmission Technology',
    abstract: 'System for efficient wireless power transmission over long distances using focused electromagnetic beams.',
    inventors: ['Dr. Tesla Modern', 'Prof. Wireless Wonder'],
    assignee: 'PowerBeam Technologies',
    filingDate: '2022-04-20',
    publicationDate: '2022-10-20',
    status: 'active',
    category: 'Energy',
    claims: [
      'Wireless power transmission system using focused beams',
      'Method for maintaining beam focus over long distances',
      'Safety system for automatic power cutoff'
    ],
    isAvailableForMinting: true
  }
];

export const mockUsers: User[] = [
  {
    address: '0x742d35Cc6634C0532925a3b8D1750d15DbfED4C6',
    username: 'TechInnovator',
    ownedNFTs: ['1', '3'],
    listedNFTs: ['1'],
    totalVolume: 45.8,
    joinDate: '2023-06-15'
  }
];