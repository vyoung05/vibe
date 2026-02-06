# ⚡ Quick Start - New Platform in 15 Minutes

## The 5 Commands

```bash
# 1. Clone it
git clone https://github.com/vyoung05/vibe.git my-platform && cd my-platform

# 2. Install it
npm install

# 3. Configure it (edit .env.local with your Supabase keys)
cp .env.example .env.local

# 4. Run it
npm start

# 5. Deploy it
vercel --prod
```

## What You Need

| Service | Sign Up | What You Get |
|---------|---------|--------------|
| [Supabase](https://supabase.com) | Free tier | Database, Auth, Storage |
| [Vercel](https://vercel.com) | Free tier | Web hosting, CI/CD |
| [Stripe](https://stripe.com) | Optional | Payments |
| [Printify](https://printify.com) | Optional | Merch/POD |

## Minimum .env.local

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

## That's It!

For full customization (branding, colors, features), see [REBRAND-GUIDE.md](./REBRAND-GUIDE.md)
