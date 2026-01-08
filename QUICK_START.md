# Quick Start Guide - Web Version

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

Make sure you have Node.js installed, then run:

```bash
npm install
```

Or if you have Bun:

```bash
bun install
```

### 2. Start the Development Server

```bash
npm run web
```

Or:

```bash
npm start
```

### 3. Open Your Browser

The app will automatically open at `http://localhost:8081` (or the next available port).

## 🎯 What You Can Do

### As a User
- ✅ Sign up and sign in
- ✅ Browse streamers and content
- ✅ Watch videos and streams
- ✅ Follow your favorite streamers
- ✅ Shop for merch
- ✅ Listen to music
- ✅ Book sessions with streamers

### As a Streamer
- ✅ Create your profile
- ✅ Go live (by providing stream URL)
- ✅ Manage your merch
- ✅ View analytics
- ✅ Interact with followers

### As an Admin
- ✅ Manage users and streamers
- ✅ View platform analytics
- ✅ Manage merch store
- ✅ Handle orders

## 📱 Test Accounts

You can create your own account or use these test credentials:

**Test Streamer Account:**
- Email: `test@streamer.com`
- Password: `test123`

## 🔧 Common Commands

```bash
# Start development server
npm run web

# Build for production
npm run build:web

# Serve production build
npm run serve

# Run linter
npm run lint

# Type check
npm run typecheck
```

## 🌐 Browser Compatibility

Works best on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## ⚠️ Known Limitations on Web

- Camera streaming is not available (use mobile app)
- Some haptic feedback features won't work
- Native gestures are limited

## 📚 Need More Help?

- See `WEB_SETUP.md` for detailed setup instructions
- See `CONVERSION_SUMMARY.md` for technical details
- Check the browser console for any errors

## 🎨 Features Showcase

### Live Streaming
Streamers can go live by providing their stream URL from platforms like:
- Twitch
- YouTube
- TikTok
- Instagram
- Kick

### Video Content
Watch videos from:
- YouTube (embedded player)
- Direct video URLs (HTML5 player)

### Merch Store
Browse and purchase merchandise with:
- Product browsing
- Shopping cart
- Checkout flow
- Order tracking

### Music Player
Listen to music with:
- Play/pause controls
- Track navigation
- Mini player (always accessible)

## 🚨 Troubleshooting

### Port Already in Use
If port 8081 is busy, Expo will automatically use the next available port.

### White Screen
1. Check browser console for errors
2. Make sure all dependencies are installed
3. Try clearing cache: `npm run web -- --clear`

### Module Errors
If you see "Module not found" errors:
1. Delete `node_modules`
2. Run `npm install` again
3. Restart the dev server

## 🎉 You're All Set!

The app should now be running in your browser. Explore the features and enjoy!

For production deployment, see `WEB_SETUP.md` for hosting options.

