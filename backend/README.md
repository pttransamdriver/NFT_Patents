# Patent NFT Backend

Production-ready backend API for the Patent NFT Marketplace with PostgreSQL database integration.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

3. **Setup database**
```bash
# Make sure PostgreSQL is running
npm run setup-db
```

4. **Start the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 🗄️ Database Schema

The backend uses PostgreSQL with the following tables:

- **users** - User accounts and search credits
- **payments** - Payment records (ETH, USDC, PSP)
- **patent_nfts** - Patent NFT metadata and ownership
- **search_history** - AI search history and results

## 🔌 API Endpoints

### Payment Endpoints
- `POST /api/payments/verify-payment` - Verify blockchain payment
- `POST /api/payments/verify-psp-payment` - Legacy PSP payment endpoint

### User Endpoints
- `GET /api/users/:address/search-credits` - Get user's search credits
- `POST /api/users/:address/deduct-credit` - Deduct credit and record search
- `GET /api/users/:address/profile` - Get user profile with stats

### Patent NFT Endpoints
- `POST /api/patents/mint` - Record patent NFT mint
- `POST /api/patents/:tokenId/transfer` - Update NFT ownership
- `POST /api/patents/:tokenId/verify` - Mark patent as verified

### System Endpoints
- `GET /api/health` - Health check with database status


## 🔒 Security Features

- CORS protection
- Input validation
- SQL injection prevention with parameterized queries
- Error handling middleware
- Database connection pooling

## 📊 Database Management

### Setup New Database
```bash
npm run setup-db
```

### Manual Database Operations
```sql
-- Connect to PostgreSQL
psql -U postgres -h localhost

-- Create database
CREATE DATABASE patent_nft_db;

-- Connect to database
\c patent_nft_db

-- View tables
\dt

-- View user credits
SELECT * FROM users;

-- View payment history
SELECT * FROM payments ORDER BY created_at DESC;
```

## 🚀 Production Deployment

### Docker Deployment (Recommended)

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

2. **Create docker-compose.yml**
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: patent_nft_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Environment Setup

1. **Production Environment Variables**
```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_PASSWORD=your_secure_password
CORS_ORIGIN=https://your-frontend-domain.com
```

2. **SSL Configuration** (for production)
```javascript
// Add to database.js for production SSL
const pool = new Pool({
  // ... other config
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

## 🧪 Testing

```bash
# Test database connection
curl http://localhost:3001/api/health

# Test user credits
curl http://localhost:3001/api/users/0x1234.../search-credits
```

## 📝 Logging

The backend logs important events:
- Payment verifications
- Database operations
- Error conditions
- Server startup

## 🔄 Migration from In-Memory Storage

If upgrading from the previous in-memory version:

1. Existing payment data will be lost (in-memory only)
2. Users will need to re-purchase credits
3. All new payments will be properly persisted
4. Consider running both versions temporarily for migration

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify credentials in .env
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in .env
   - Kill existing process: `lsof -ti:3001 | xargs kill`

3. **CORS Errors**
   - Update CORS_ORIGIN in .env
   - Ensure frontend URL matches exactly

### Debug Mode
```bash
DEBUG=* npm run dev
```
