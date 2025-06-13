export interface NFT {
  id: string;
  patentNumber: string;
  title: string;
  description: string;
  inventor: string;
  assignee: string;
  filingDate: string;
  category: string;
  status: 'active' | 'expired' | 'pending';
  price: number;
  priceChange: number;
  owner: string;
  creator: string;
  mintDate: string;
  isListed: boolean;
  views: number;
  likes: number;
  imageUrl?: string;
  ipfsHash?: string;
  transactionHistory: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'mint' | 'sale' | 'transfer' | 'list';
  from: string;
  to: string;
  price?: number;
  date: string;
  txHash: string;
}

export interface Patent {
  patentNumber: string;
  title: string;
  abstract: string;
  inventors: string[];
  assignee: string;
  filingDate: string;
  publicationDate: string;
  status: 'active' | 'expired' | 'pending';
  category: string;
  claims: string[];
  isAvailableForMinting: boolean;
}

export interface User {
  address: string;
  username?: string;
  avatar?: string;
  ownedNFTs: string[];
  listedNFTs: string[];
  totalVolume: number;
  joinDate: string;
}

export interface SearchFilters {
  category?: string;
  status?: string;
  priceRange?: [number, number];
  dateRange?: [string, string];
  sortBy?: 'price' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}