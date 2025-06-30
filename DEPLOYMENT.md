# GitHub Pages Deployment Guide

## Setup Steps

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repo → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: "gh-pages"
   - Folder: "/ (root)"

3. **Your site will be live at**:
   `https://[your-username].github.io/NFT_patents/`

## Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
npm run build
npx gh-pages -d dist
```

## Notes
- First deployment takes 5-10 minutes
- Updates deploy automatically on push to main
- Check Actions tab for deployment status