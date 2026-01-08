# Upload to GitHub

## 🚀 Quick Guide

### Step 1: Initialize Git Repository (if not already done)

Open your terminal and run:

```bash
cd "d:\Downloads_2\019a907a-9fd1-7628-85e5-c02066e3068a-Oqd4_lGqBvDX-2026-01-05-13-59"
git init
```

### Step 2: Create .gitignore

Make sure you have a `.gitignore` file to exclude unnecessary files:

```bash
# Check if .gitignore exists
ls .gitignore
```

If it doesn't exist or needs updating, create/update it with:

```
# Dependencies
node_modules/
bun.lockb

# Expo
.expo/
dist/
web-build/

# Environment variables
.env
.env.local
.env.production

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Build outputs
build/
*.tsbuildinfo

# Testing
coverage/

# Misc
.cache/
```

### Step 3: Stage All Files

```bash
git add .
```

### Step 4: Create Initial Commit

```bash
git commit -m "Initial commit: React Native app with web support"
```

### Step 5: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the **"+"** button in the top right
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: e.g., `vibecode-app`
   - **Description**: "Live streaming platform - Mobile and Web"
   - **Public** or **Private**: Your choice
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

### Step 6: Link Local Repository to GitHub

GitHub will show you commands like these. Copy and run them:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR-USERNAME` and `YOUR-REPO-NAME` with your actual values.

## 🌐 Deploy to GitHub Pages (Optional)

If you want to host your web app for free on GitHub Pages:

### Step 1: Install gh-pages

```bash
npm install --save-dev gh-pages
```

### Step 2: Update package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "predeploy": "npm run build:web",
    "deploy": "gh-pages -d dist"
  }
}
```

Also add a `homepage` field:

```json
{
  "homepage": "https://YOUR-USERNAME.github.io/YOUR-REPO-NAME"
}
```

### Step 3: Deploy

```bash
npm run deploy
```

This will:
1. Build your web app
2. Create a `gh-pages` branch
3. Push the build to that branch
4. Make it available at `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME`

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll to **Pages** section
4. Under **Source**, select `gh-pages` branch
5. Click **Save**

Your site will be live in a few minutes!

## 🔐 Important: Protect Your Secrets

**NEVER commit sensitive information!**

Before committing, make sure these are in `.gitignore`:
- `.env` files
- API keys
- Database credentials
- Private keys

### Create .env.example

Create a template file for others:

```bash
# Copy your .env to .env.example
cp .env .env.example
```

Then edit `.env.example` and replace real values with placeholders:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key_here
EXPO_PUBLIC_VIBECODE_PROJECT_ID=your_project_id_here
```

Commit `.env.example` but NOT `.env`:

```bash
git add .env.example
git commit -m "Add environment variables template"
git push
```

## 📝 Common Git Commands

### Check Status
```bash
git status
```

### Add Files
```bash
# Add specific file
git add filename.txt

# Add all changes
git add .
```

### Commit Changes
```bash
git commit -m "Your commit message"
```

### Push to GitHub
```bash
git push
```

### Pull Latest Changes
```bash
git pull
```

### Create a Branch
```bash
git checkout -b feature-name
```

### Switch Branches
```bash
git checkout main
```

### Merge Branch
```bash
git checkout main
git merge feature-name
```

## 🚨 Troubleshooting

### "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
```

### "Permission denied (publickey)"
You need to set up SSH keys or use HTTPS with a personal access token.

**Option 1: Use HTTPS (easier)**
```bash
git remote set-url origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
```

**Option 2: Set up SSH keys**
Follow [GitHub's SSH guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

### "Failed to push some refs"
Pull first, then push:
```bash
git pull --rebase origin main
git push
```

### Large File Error
If you accidentally tried to commit large files:
```bash
# Remove from staging
git reset HEAD path/to/large/file

# Add to .gitignore
echo "path/to/large/file" >> .gitignore
```

## 📦 What Gets Uploaded

✅ **Will be uploaded:**
- Source code (`src/`)
- Configuration files
- Documentation
- Assets (images, icons)
- Package files (`package.json`, etc.)

❌ **Won't be uploaded (in .gitignore):**
- `node_modules/`
- `.env` files
- Build outputs (`dist/`, `build/`)
- Cache files
- OS-specific files

## 🎯 Best Practices

1. **Commit Often**: Make small, focused commits
2. **Write Good Messages**: Describe what and why
3. **Use Branches**: Create branches for new features
4. **Review Before Commit**: Check `git status` and `git diff`
5. **Pull Before Push**: Always pull latest changes first
6. **Protect Main**: Consider protecting the main branch

## 📚 Sample Commit Messages

Good commit messages:
```
✅ "Add web support with webpack configuration"
✅ "Fix: Resolve video player issues on Safari"
✅ "Update: Improve mobile responsiveness"
✅ "Docs: Add GitHub deployment guide"
```

Bad commit messages:
```
❌ "Fixed stuff"
❌ "Update"
❌ "asdf"
❌ "wip"
```

## 🔄 Typical Workflow

```bash
# 1. Make changes to your code
# 2. Check what changed
git status
git diff

# 3. Stage your changes
git add .

# 4. Commit with a message
git commit -m "Add new feature: user profiles"

# 5. Pull latest changes
git pull

# 6. Push your changes
git push
```

## 🌟 Advanced: Automatic Deployments

Set up GitHub Actions to automatically deploy on push:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build:web
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Now every push to `main` will automatically deploy your web app!

## 📞 Need Help?

- [GitHub Docs](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Pages Guide](https://pages.github.com)

## ✅ Checklist

Before pushing to GitHub:
- [ ] Created `.gitignore` file
- [ ] Removed sensitive data from code
- [ ] Created `.env.example` (not `.env`)
- [ ] Tested the app locally
- [ ] Wrote good commit messages
- [ ] Reviewed changes with `git status`
- [ ] All files staged with `git add .`
- [ ] Committed with `git commit -m "message"`
- [ ] Created GitHub repository
- [ ] Linked local repo to GitHub
- [ ] Pushed with `git push`

You're all set! 🎉

