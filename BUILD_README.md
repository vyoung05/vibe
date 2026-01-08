# Build Instructions

## Current Build Issues

If you're seeing build errors on Vercel/Netlify, try these solutions:

### Solution 1: Manual Vercel Settings (RECOMMENDED)

Instead of using vercel.json, configure directly in Vercel dashboard:

1. Go to your project settings in Vercel
2. **Build & Development Settings:**
   - Framework Preset: `Other`
   - Build Command: `npm ci --legacy-peer-deps && npx expo export --platform web`
   - Output Directory: `dist`
   - Install Command: Leave blank (uses package.json)
   
3. **Environment Variables:**
   - Add: `NODE_VERSION` = `18`
   - Add: `NODE_OPTIONS` = `--max-old-space-size=4096`

4. **Redeploy** from the Deployments tab

### Solution 2: Use GitHub Actions to Build

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
        
      - name: Build
        run: npx expo export --platform web
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          working-directory: ./dist
```

### Solution 3: Build Locally and Deploy

If automated builds keep failing:

1. **Install Node.js 18** from https://nodejs.org
2. **Build locally:**
   ```bash
   npm install --legacy-peer-deps
   npm run build:web
   ```
3. **Deploy the dist folder** manually:
   - Vercel: `npx vercel --prod`
   - Netlify: Drag and drop `dist` folder to Netlify dashboard

### Solution 4: Simplify Configuration

Remove custom configurations and use defaults:

1. Delete `vercel.json`
2. Delete `netlify.toml`
3. In Vercel/Netlify dashboard, set:
   - Build: `npx expo export --platform web`
   - Output: `dist`
   - Node: `18`

## Common Build Errors

### "Command exited with 1"
- Generic error, check full build logs
- Usually dependency or TypeScript issues

### "Out of memory"
- Add: `NODE_OPTIONS=--max-old-space-size=4096`

### "Module not found"
- Run: `npm ci --legacy-peer-deps`
- Check if all dependencies are in package.json

### "Peer dependency warnings"
- Normal! Just warnings, not errors
- Using `--legacy-peer-deps` handles this

## Current Status

The app is configured to work with:
- ✅ Expo 53
- ✅ React Native Web
- ✅ Metro bundler
- ✅ Node.js 18

Build command: `expo export --platform web`
Output directory: `dist`

