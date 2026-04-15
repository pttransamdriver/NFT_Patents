# Troubleshooting Minting Issues

## Problem: "Unknown" Inventor or Generic Patent Names on Marketplace

### Root Causes & Solutions

#### 1. **PINATA_JWT Not Set in Vercel**
**Symptom**: Metadata upload fails silently, NFT mints with placeholder data

**Fix**:
1. Go to Vercel Dashboard → NFT_Patents Backend
2. Settings → Environment Variables
3. Verify `PINATA_JWT` is set and not empty
4. Redeploy backend

**Check**: 
```bash
curl https://nft-patents-backend.vercel.app/api/health
# Should show: "pinata": { "enabled": true }
```

#### 2. **VVITE_IPFS_GATEWAY Typo (Extra V)**
**Symptom**: IPFS gateway not working, images/metadata not loading

**Fix**:
1. Vercel Dashboard → Frontend Settings → Environment Variables
2. Find `VVITE_IPFS_GATEWAY` (wrong)
3. Delete it
4. Add `VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/` (correct)
5. Redeploy frontend

#### 3. **Old KV Variables Still Present**
**Symptom**: Backend trying to use Vercel KV instead of IPFS

**Fix**: Remove these from Vercel backend environment:
- `KV_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_REST_API_URL`
- `REDIS_URL`
- `PINATA_SECRET_KEY`
- `PINATA_API_KEY`

Keep only: `PINATA_JWT`, `SERPAPI_KEY`, `CORS_ORIGIN`, `NODE_ENV`

#### 4. **Patent Data Not Flowing to Minting Service**
**Symptom**: Metadata shows generic names, not actual patent titles

**Check**:
1. Open browser DevTools → Console
2. Verify Patent step shows correct title/inventor
3. Check Network tab → `/api/patents/verify/{patentNumber}` response
4. Should include: `title`, `abstract`, `inventor`, `assignee`

**If missing**: Backend patent verification endpoint broken

#### 5. **IPFS Upload Failing**
**Symptom**: Minting succeeds but metadata not on IPFS

**Check**:
1. Browser Console → look for "📤 Uploading metadata to IPFS"
2. Check Network tab → `POST /api/pinata/upload-json`
3. Response should have `success: true, ipfsHash: QmXXX`

**If failing**:
- Check backend logs in Vercel
- Verify `PINATA_JWT` is valid (not expired)
- Test: `curl -X POST https://nft-patents-backend.vercel.app/api/pinata/upload-json`

#### 6. **Marketplace Not Fetching Metadata**
**Symptom**: NFT minted but marketplace shows "Unknown"

**Check**:
1. Get IPFS hash from minting transaction
2. Visit: `https://ipfs.io/ipfs/{hash}`
3. Should show JSON with patent metadata
4. If 404: metadata never uploaded to IPFS

**Fix**: Re-mint the NFT (metadata will upload correctly now)

## Quick Diagnostic Checklist

- [ ] Backend deployed and running (`/api/health` returns 200)
- [ ] `PINATA_JWT` set in Vercel backend
- [ ] `VITE_IPFS_GATEWAY` (not `VVITE_IPFS_GATEWAY`) set in Vercel frontend
- [ ] Old KV variables removed from Vercel
- [ ] Patent verification returns full data (title, inventor, etc.)
- [ ] Browser console shows "✅ Metadata uploaded to IPFS: QmXXX"
- [ ] IPFS gateway URL works: `https://ipfs.io/ipfs/QmXXX`
- [ ] Marketplace displays patent title and inventor

## Testing Steps

### 1. Test Backend Health
```bash
curl https://nft-patents-backend.vercel.app/api/health
```
Expected: `{ "status": "ok", "services": { "pinata": { "enabled": true } } }`

### 2. Test Patent Verification
```bash
curl https://nft-patents-backend.vercel.app/api/patents/verify/US12325364
```
Expected: Patent data with title, inventor, abstract

### 3. Test IPFS Upload
Use browser DevTools to mint an NFT and watch:
- Console logs for "📤 Uploading metadata to IPFS"
- Network tab for successful `/api/pinata/upload-json` response

### 4. Verify Metadata on IPFS
After minting, get the IPFS hash and visit:
```
https://ipfs.io/ipfs/{hash}
```
Should show JSON with all patent metadata

## Still Having Issues?

1. **Check Vercel Deployment Logs**:
   - Vercel Dashboard → Deployments → View Logs
   - Look for errors in backend startup

2. **Check Browser Console**:
   - Open DevTools → Console
   - Look for error messages during minting

3. **Check Network Requests**:
   - DevTools → Network tab
   - Filter by `/api/` to see backend calls
   - Check response status and data

4. **Verify Smart Contract**:
   - Check that NFT was actually minted (check blockchain)
   - Verify tokenURI is set to `ipfs://QmXXX` format

