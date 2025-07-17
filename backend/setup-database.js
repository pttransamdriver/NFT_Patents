#!/usr/bin/env node

/**
 * Database Setup Script for Patent NFT Backend
 * 
 * This script sets up the PostgreSQL database for the Patent NFT application.
 * Run this script before starting the backend server for the first time.
 * 
 * Usage:
 *   node setup-database.js
 * 
 * Prerequisites:
 *   - PostgreSQL installed and running
 *   - Database credentials configured in .env file
 */

const { Pool } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  console.log('🔧 Setting up Patent NFT Database...\n');

  // First, connect to PostgreSQL without specifying a database to create the database
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    // Don't specify database to connect to default postgres database
  });

  try {
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'patent_nft_db';
    console.log(`📦 Creating database: ${dbName}`);
    
    const client = await adminPool.connect();
    try {
      // Check if database exists
      const result = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
      );

      if (result.rows.length === 0) {
        // Create database
        await client.query(`CREATE DATABASE "${dbName}"`);
        console.log(`✅ Database "${dbName}" created successfully`);
      } else {
        console.log(`ℹ️  Database "${dbName}" already exists`);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    process.exit(1);
  } finally {
    await adminPool.end();
  }

  // Now connect to the specific database and create tables
  const { initializeDatabase } = require('./database');
  
  try {
    console.log('\n🏗️  Creating tables and indexes...');
    await initializeDatabase();
    console.log('✅ Database tables created successfully');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with the correct database credentials');
    console.log('2. Start the backend server: npm start');
    console.log('3. The server will be available at http://localhost:3001');
    
  } catch (error) {
    console.error('❌ Error setting up database tables:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your database credentials in .env file');
    console.error('3. Ensure the database user has CREATE privileges');
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };
