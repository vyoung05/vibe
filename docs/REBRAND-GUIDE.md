# 🎨 Rebrand & Launch Guide

This guide walks you through spinning up a new instance of the platform with your own branding.

---

## Quick Overview

| Step | Time | Difficulty |
|------|------|------------|
| 1. Clone & Setup | 5 min | Easy |
| 2. Supabase Project | 10 min | Easy |
| 3. Environment Variables | 5 min | Easy |
| 4. Branding & Theme | 15 min | Easy |
| 5. Deploy to Vercel | 5 min | Easy |
| 6. Custom Domain | 10 min | Easy |
| **Total** | **~50 min** | |

---

## Step 1: Clone & Setup

```bash
# Clone the repository
git clone https://github.com/vyoung05/vibe.git my-new-platform
cd my-new-platform

# Install dependencies
npm install

# Remove git history (fresh start)
rm -rf .git
git init
git add .
git commit -m "Initial commit - forked from Vibe platform"
```

---

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** (Settings → API)
3. Run the database schema:

```bash
# Option A: Use Supabase CLI
supabase db push

# Option B: Copy/paste into SQL Editor
# Open supabase-schema.sql and run it in Supabase Dashboard → SQL Editor
```

4. Create storage buckets (Storage → New Bucket):
   - `avatars` (public)
   - `posts` (public)
   - `tracks` (public)
   - `covers` (public)
   - `merch` (public)

5. Set up storage policies (copy from `supabase-schema.sql` storage section)

---

## Step 3: Environment Variables

Create `.env.local` in project root:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe (optional - for payments)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
# Add STRIPE_SECRET_KEY to Supabase Edge Function secrets

# App Identity
EXPO_PUBLIC_APP_NAME=YourAppName
EXPO_PUBLIC_APP_TAGLINE=Your tagline here
```

---

## Step 4: Branding & Theme

### 4.1 App Name & Text

**File: `app.json`**
```json
{
  "expo": {
    "name": "YourAppName",
    "slug": "your-app-name",
    "scheme": "yourapp"
  }
}
```

**File: `src/screens/HomeScreen.tsx`** (and other screens)
- Search for "DDNS" and replace with your app name
- Search for "Day Dreamers Night Streamers" and replace with your tagline

### 4.2 Colors & Theme

**File: `tailwind.config.js`**
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary brand color
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',  // Main purple - CHANGE THIS
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Background colors
        background: {
          primary: '#0A0A0F',   // Main dark bg
          secondary: '#151520', // Card bg
          tertiary: '#1C1C26',  // Input bg
        }
      }
    }
  }
}
```

### 4.3 Logo & Icons

**Replace these files:**
- `assets/icon.png` — App icon (1024x1024)
- `assets/favicon.png` — Web favicon (48x48)
- `assets/splash.png` — Splash screen (1284x2778)
- `assets/adaptive-icon.png` — Android adaptive icon (1024x1024)

**In-app logo:** Search for the "V" logo component and replace:
```tsx
// Find this pattern and update:
<View className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500">
  <Text className="text-white text-3xl font-bold">V</Text>
</View>

// Replace with your logo:
<Image source={require('../assets/logo.png')} style={{ width: 64, height: 64 }} />
```

### 4.4 Social Links & Footer

**File: `src/types/index.ts`**
Update `SocialLinks` interface if you need different platforms.

---

## Step 5: Deploy to Vercel

### 5.1 Create Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login & deploy
vercel login
vercel --prod
```

### 5.2 Add Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 5.3 Deploy Edge Functions (Stripe)

```bash
# In your Supabase project
supabase functions deploy create-checkout
supabase functions deploy verify-checkout

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
```

---

## Step 6: Custom Domain

### Vercel (Web)
1. Vercel Dashboard → Domains
2. Add your domain (e.g., `app.yourbrand.com`)
3. Update DNS records as instructed

### Mobile Apps (Later)
1. Update `app.json` with your bundle identifiers
2. Build with EAS: `eas build --platform all`
3. Submit to App Store / Play Store

---

## Feature Toggles

Want to disable certain features? Edit the navigation:

**File: `src/navigation/MainTabs.tsx`**

```tsx
// Comment out tabs you don't need:
// <Tab.Screen name="Music" component={MusicScreen} />
// <Tab.Screen name="Merch" component={MerchScreen} />
// <Tab.Screen name="Bookings" component={BookingsScreen} />
```

---

## Platform Variations

### Music-Only Platform
- Keep: Music, Artists, Feed, Profile
- Remove: Streaming, Merch, Bookings
- Focus: Track uploads, sales, discovery

### Streaming-Only Platform
- Keep: Streamers, Live, Feed, Profile
- Remove: Music, Merch (or keep merch)
- Focus: Go-live, chat, tipping

### Merch Marketplace
- Keep: Merch Store, Creators, Profile
- Remove: Music, Streaming
- Focus: POD products, creator shops

### Social/Community App
- Keep: Feed, Profiles, Messaging
- Remove: Music, Streaming, Merch
- Focus: Posts, stories, connections

---

## Checklist Before Launch

- [ ] All "DDNS" text replaced
- [ ] Logo and icons updated
- [ ] Colors match your brand
- [ ] Supabase project created & schema loaded
- [ ] Storage buckets created with policies
- [ ] Environment variables set (local + Vercel)
- [ ] Stripe connected (if using payments)
- [ ] Test user signup flow
- [ ] Test key features (post, stream, buy)
- [ ] Custom domain configured
- [ ] Privacy Policy & Terms of Service pages

---

## File Reference

| What | Where |
|------|-------|
| App config | `app.json` |
| Colors/Theme | `tailwind.config.js` |
| Environment | `.env.local` |
| Database schema | `supabase-schema.sql` |
| Navigation | `src/navigation/` |
| Screens | `src/screens/` |
| Components | `src/components/` |
| State/Stores | `src/state/` |
| API Services | `src/services/` |
| Types | `src/types/` |

---

## Need Help?

This platform was built by Vincent Young with Vector (AI assistant).

For questions or custom development:
- GitHub: github.com/vyoung05/vibe
- Built with: React Native, Expo, Supabase, Stripe

---

*Last updated: February 6, 2026*
