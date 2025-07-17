const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'patent_nft_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Database initialization
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        address VARCHAR(42) UNIQUE NOT NULL,
        search_credits INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_address VARCHAR(42) NOT NULL,
        transaction_hash VARCHAR(66) UNIQUE NOT NULL,
        payment_type VARCHAR(10) NOT NULL, -- 'ETH', 'USDC', 'PSP'
        token_amount DECIMAL(36, 18) NOT NULL,
        search_credits INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        block_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP,
        FOREIGN KEY (user_address) REFERENCES users(address)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS patent_nfts (
        id SERIAL PRIMARY KEY,
        token_id INTEGER UNIQUE NOT NULL,
        owner_address VARCHAR(42) NOT NULL,
        title TEXT NOT NULL,
        inventor TEXT NOT NULL,
        patent_number VARCHAR(50) NOT NULL,
        token_uri TEXT NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        filing_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        user_address VARCHAR(42) NOT NULL,
        search_query TEXT NOT NULL,
        search_results JSONB,
        credits_used INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_address) REFERENCES users(address)
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
      CREATE INDEX IF NOT EXISTS idx_payments_user_address ON payments(user_address);
      CREATE INDEX IF NOT EXISTS idx_payments_transaction_hash ON payments(transaction_hash);
      CREATE INDEX IF NOT EXISTS idx_patent_nfts_token_id ON patent_nfts(token_id);
      CREATE INDEX IF NOT EXISTS idx_patent_nfts_owner ON patent_nfts(owner_address);
      CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_address);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// User operations
async function getOrCreateUser(address) {
  const client = await pool.connect();
  try {
    // Try to get existing user
    let result = await client.query('SELECT * FROM users WHERE address = $1', [address]);
    
    if (result.rows.length === 0) {
      // Create new user
      result = await client.query(
        'INSERT INTO users (address) VALUES ($1) RETURNING *',
        [address]
      );
    }
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function updateUserCredits(address, credits) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE users SET search_credits = $1, updated_at = CURRENT_TIMESTAMP WHERE address = $2 RETURNING *',
      [credits, address]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function addUserCredits(address, creditsToAdd) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE users SET search_credits = search_credits + $1, updated_at = CURRENT_TIMESTAMP WHERE address = $2 RETURNING *',
      [creditsToAdd, address]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Payment operations
async function createPayment(paymentData) {
  const client = await pool.connect();
  try {
    const { userAddress, transactionHash, paymentType, tokenAmount, searchCredits, blockNumber } = paymentData;
    
    const result = await client.query(
      `INSERT INTO payments (user_address, transaction_hash, payment_type, token_amount, search_credits, block_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userAddress, transactionHash, paymentType, tokenAmount, searchCredits, blockNumber]
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function verifyPayment(transactionHash) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE payments SET status = $1, verified_at = CURRENT_TIMESTAMP WHERE transaction_hash = $2 RETURNING *',
      ['confirmed', transactionHash]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function getPaymentByHash(transactionHash) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM payments WHERE transaction_hash = $1', [transactionHash]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Patent NFT operations
async function createPatentNFT(nftData) {
  const client = await pool.connect();
  try {
    const { tokenId, ownerAddress, title, inventor, patentNumber, tokenUri, filingDate } = nftData;
    
    const result = await client.query(
      `INSERT INTO patent_nfts (token_id, owner_address, title, inventor, patent_number, token_uri, filing_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tokenId, ownerAddress, title, inventor, patentNumber, tokenUri, filingDate]
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function updatePatentNFTOwner(tokenId, newOwnerAddress) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE patent_nfts SET owner_address = $1, updated_at = CURRENT_TIMESTAMP WHERE token_id = $2 RETURNING *',
      [newOwnerAddress, tokenId]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function verifyPatentNFT(tokenId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE patent_nfts SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE token_id = $1 RETURNING *',
      [tokenId]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Search history operations
async function createSearchRecord(userAddress, searchQuery, searchResults, creditsUsed = 1) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO search_history (user_address, search_query, search_results, credits_used) VALUES ($1, $2, $3, $4) RETURNING *',
      [userAddress, searchQuery, JSON.stringify(searchResults), creditsUsed]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Cleanup function
async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  initializeDatabase,
  getOrCreateUser,
  updateUserCredits,
  addUserCredits,
  createPayment,
  verifyPayment,
  getPaymentByHash,
  createPatentNFT,
  updatePatentNFTOwner,
  verifyPatentNFT,
  createSearchRecord,
  closePool
};
