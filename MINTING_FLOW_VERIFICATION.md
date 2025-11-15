# NFT Minting Flow - Complete Verification

## ✅ Complete Data Flow (Search → Mint → IPFS → Marketplace)

### 1. **Patent Verification (Backend)**
**File**: `backend/routes/patents.js`
- Endpoint: `POST /api/patents/verify/:patentNumber`
- Returns: `{ success, patent: { patentNumber, title, abstract, inventors[], inventor, assignee, filingDate, status, category, isAvailableForMinting } }`
- **Key**: Returns BOTH `inventors` (array) AND `inventor` (string) for compatibility

### 2. **Frontend Receives Patent Data**
**File**: `src/pages/MintNFTPage.tsx` (lines 84-98)
- Stores verification result with all patent fields
- Displays metadata preview to user
- Passes complete `verificationResult.patent` to minting service

### 3. **Minting Service Creates Metadata**
**File**: `src/services/mintingService.ts` (lines 100-143)
- Creates NFT metadata object with:
  - `name`: `params.patentData.title`
  - `description`: `params.patentData.abstract`
  - `image`: PDF URL from IPFS
  - `attributes`: Patent Number, Title, Inventor, Assignee, Filing Date, Country, Status, Storage, Minted
- **Critical**: Uses `params.patentData.inventor` (string) for the Inventor attribute

### 4. **Metadata Upload to IPFS**
**File**: `src/services/patentPdfService.ts` (lines 144-170)
- Method: `storeMetadataOnIPFS(metadata, filename)`
- Calls backend: `POST /api/pinata/upload-json`
- Backend (`backend/routes/ipfs.js` lines 67-112):
  - Validates `PINATA_JWT` environment variable
  - Uploads JSON to Pinata using `pinJSONToIPFS` endpoint
  - Returns IPFS hash
- **Result**: Metadata stored on IPFS with all patent data

### 5. **Smart Contract Minting**
**File**: `src/services/mintingService.ts` (lines 200-250)
- Calls `PatentNFT.mint(to, metadataIpfsHash)`
- Smart contract stores: `tokenURI = ipfs://{metadataIpfsHash}`
- **Result**: NFT created with IPFS metadata URI

### 6. **Marketplace Retrieval**
**File**: `src/services/marketplaceService.ts` (lines 120-145)
- Gets active listings from marketplace contract
- For each NFT:
  1. Calls `patentNFTContract.tokenURI(tokenId)` → gets `ipfs://QmXXX`
  2. Converts to HTTP gateway: `https://ipfs.io/ipfs/QmXXX`
  3. Fetches metadata JSON from IPFS
  4. Extracts attributes using `getAttribute('Inventor')` → gets inventor string
  5. Displays: `title`, `inventor`, `imageUrl`

## 🔍 Why Metadata Now Shows Correctly

### Before (Broken):
- ❌ Backend stored metadata in Vercel KV (unreliable)
- ❌ Frontend didn't pass patent data to minting service
- ❌ Metadata created with generic/missing fields
- ❌ IPFS upload failed silently

### After (Fixed):
- ✅ Backend removed KV storage (IPFS-only)
- ✅ Frontend passes complete `verificationResult.patent` to minting
- ✅ Minting service creates metadata with all patent fields
- ✅ Metadata uploaded to IPFS via secure backend proxy
- ✅ Smart contract stores IPFS URI
- ✅ Marketplace fetches and displays metadata correctly

## 🚀 Testing the Flow

### Step 1: Verify Patent
```
Input: US-12325364-B1
Backend returns: { title, abstract, inventors[], inventor, assignee, ... }
```

### Step 2: Preview NFT
```
Shows: Title, Abstract, Inventor, Assignee, Filing Date
All fields populated from backend response
```

### Step 3: Mint NFT
```
1. Creates metadata with all patent data
2. Uploads to IPFS via backend proxy
3. Gets IPFS hash (QmXXX)
4. Mints NFT with ipfs://QmXXX URI
```

### Step 4: View on Marketplace
```
1. Fetches metadata from IPFS
2. Displays: Patent Title, Inventor, Patent Image
3. All fields match what was minted
```

## ⚠️ Critical Environment Variables

**Backend (Vercel)**:
- `PINATA_JWT` ✅ (required for IPFS uploads)
- `SERPAPI_KEY` ✅ (required for patent search)
- `CORS_ORIGIN` ✅ (required for frontend requests)
- `NODE_ENV=production` ✅

**Frontend (Vercel)**:
- `VITE_API_BASE_URL=https://nft-patents-backend.vercel.app` ✅
- `VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/` ✅ (note: NOT `VVITE_IPFS_GATEWAY`)
- `VITE_PATENT_NFT_ADDRESS` ✅
- `VITE_MARKETPLACE_ADDRESS` ✅

## ✅ Conclusion

The complete minting flow is now properly implemented:
1. Patent data flows from backend verification → frontend → minting service
2. Metadata is created with all patent fields
3. Metadata is securely uploaded to IPFS via backend proxy
4. Smart contract stores IPFS URI
5. Marketplace retrieves and displays metadata correctly

**No more "Unknown" inventors or generic patent names!** 🎉

