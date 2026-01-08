# Manual Vercel Setup - Step by Step

I've removed the automated config files because they were causing issues. **Manual configuration is more reliable!**

## 🎯 Follow These Exact Steps

### Step 1: Go to Your Vercel Project

1. Open: https://vercel.com/dashboard
2. Find your project `vibe` (or whatever you named it)
3. Click on it

### Step 2: Go to Settings

1. Click the **"Settings"** tab at the top
2. In the left sidebar, click **"General"**

### Step 3: Configure Build & Development Settings

Scroll down to **"Build & Development Settings"**

You'll see several fields. Click "Override" on each and set:

#### Framework Preset
```
Other
```

#### Build Command
Click "Override" and enter:
```
npx expo export --platform web
```

#### Output Directory
Click "Override" and enter:
```
dist
```

#### Install Command
Click "Override" and enter:
```
npm install --legacy-peer-deps
```

#### Development Command
Leave empty (don't override)

**Click "Save" button at the bottom!**

### Step 4: Set Node.js Version

Still in Settings → General, scroll to find **"Node.js Version"**

1. Click the dropdown
2. Select: **18.x**
3. Click "Save"

### Step 5: Add Environment Variables

1. In Settings, click **"Environment Variables"** in left sidebar
2. Click "Add New" button
3. Add this variable:

```
Key: NODE_OPTIONS
Value: --max-old-space-size=4096
```

4. Under "Environment", check all three boxes:
   - ☑ Production
   - ☑ Preview  
   - ☑ Development

5. Click "Save"

### Step 6: Add CSP Environment Variable (Important!)

Add another environment variable:

```
Key: EXPO_NO_METRO_LAZY
Value: 1
```

Check all three environment boxes again, then Save.

### Step 7: Redeploy

1. Go to the **"Deployments"** tab at the top
2. Find the most recent deployment (should be at the top)
3. Click the **three dots (...)** on the right side
4. Click **"Redeploy"**
5. **IMPORTANT**: Uncheck "Use existing Build Cache"
6. Click the **"Redeploy"** button

### Step 8: Watch the Build

1. After clicking redeploy, you'll see the deployment in progress
2. Click on it to see the build logs
3. Watch for these signs of success:
   - ✅ Installing dependencies...
   - ✅ Running build command...
   - ✅ Bundling JavaScript...
   - ✅ Build completed
   - ✅ Deploying...

### Step 9: Check Your Site

Once deployment completes:
1. Click on the deployment URL (should be at the top)
2. Your site should load!
3. If you see white screen, press F12 and check console for errors

## 🚨 If Build Still Fails

If you see errors in the build log, tell me:

1. **The exact error message** (copy and paste)
2. **Which step it failed on** (Installing? Building? Deploying?)
3. **Full error output** if possible

Common errors and solutions:

### "Cannot find module"
```
In Install Command, use:
npm ci --legacy-peer-deps
```

### "Out of memory"
```
Already added! The NODE_OPTIONS variable should fix this.
```

### "expo: command not found"
```
In Build Command, use:
npx --yes expo export --platform web
```

### TypeScript errors
```
In Build Command, add --no-typecheck:
npx expo export --platform web --no-typecheck
```

## 📋 Quick Reference - What You Should Have Set

```
Framework: Other
Build Command: npx expo export --platform web
Output Directory: dist
Install Command: npm install --legacy-peer-deps
Node Version: 18.x

Environment Variables:
- NODE_OPTIONS = --max-old-space-size=4096
- EXPO_NO_METRO_LAZY = 1
```

## ✅ Success Checklist

- [ ] Went to Vercel dashboard
- [ ] Opened project settings
- [ ] Set Framework to "Other"
- [ ] Set Build Command
- [ ] Set Output Directory to "dist"
- [ ] Set Install Command with --legacy-peer-deps
- [ ] Set Node version to 18.x
- [ ] Added NODE_OPTIONS environment variable
- [ ] Added EXPO_NO_METRO_LAZY environment variable
- [ ] Clicked Redeploy with cache OFF
- [ ] Build completed successfully
- [ ] Site is live!

## 💡 Why Manual Configuration?

File-based config (vercel.json) sometimes conflicts with Vercel's build system. Manual configuration through the dashboard is:
- ✅ More reliable
- ✅ Easier to debug
- ✅ Better for Expo projects
- ✅ No file conflicts

Good luck! Let me know how it goes! 🚀

