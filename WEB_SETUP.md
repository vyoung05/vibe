# Web Setup Guide

This guide will help you run the VibeCode app as a website.

## Prerequisites

- Node.js 18+ or Bun installed
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Installation

1. Install dependencies:
```bash
bun install
```

Or with npm:
```bash
npm install
```

## Running the Web App

### Development Mode

Start the development server:
```bash
bun run web
```

Or:
```bash
npm run web
```

The app will be available at `http://localhost:8081` (or another port if 8081 is in use).

### Building for Production

Build the web app for production:
```bash
bun run build:web
```

Or:
```bash
npm run build:web
```

The built files will be in the `dist` folder.

### Serving the Production Build

After building, serve the production files:
```bash
bun run serve
```

Or:
```bash
npm run serve
```

## Web-Specific Features

### What Works on Web

- ✅ User authentication (sign in/sign up)
- ✅ Browse streamers and content
- ✅ View profiles
- ✅ Search functionality
- ✅ Music player
- ✅ Merch store
- ✅ Admin dashboard
- ✅ Video playback (YouTube and direct URLs)
- ✅ Social features (follow, like, comment)
- ✅ Notifications
- ✅ Bookings

### Web Limitations

- ❌ Camera streaming (use mobile app for camera-based streaming)
- ❌ Some native-only features (haptics, native gestures)
- ⚠️ Limited offline support

### Camera Streaming on Web

The camera streaming feature is not available on web due to browser limitations. However, streamers can still:
1. Go live by providing a link to their stream on platforms like Twitch, YouTube, etc.
2. Their followers will be notified
3. Viewers can watch the stream by clicking the link

## Troubleshooting

### Port Already in Use

If port 8081 is already in use, Expo will automatically try the next available port.

### Build Errors

If you encounter build errors, try:
```bash
# Clear cache
bun run web --clear

# Or with npm
npm run web -- --clear
```

### Module Not Found Errors

Some React Native modules don't have web support. The app has been configured to mock these modules on web. If you encounter issues:

1. Check `metro.config.js` for the list of mocked modules
2. Add any problematic modules to the `nativeOnlyModules` array

## Browser Compatibility

The web app works best on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Environment Variables

Make sure you have the necessary environment variables set up. Check `.env.example` if available.

## Support

For issues specific to the web version, please check:
1. Browser console for errors
2. Network tab for failed requests
3. Ensure all dependencies are installed correctly

## Deployment

To deploy the web app:

1. Build for production: `bun run build:web`
2. Upload the `dist` folder to your hosting provider
3. Configure your server to serve the `index.html` file for all routes (for client-side routing)

### Recommended Hosting Providers

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

## Development Tips

- Use browser DevTools for debugging
- The web version uses the same state management as mobile
- Hot reload is enabled in development mode
- Check the console for any warnings or errors

