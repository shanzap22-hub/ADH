# Native Splash Screen Implementation

## Overview
The ADH LMS app now has a **native splash screen** that displays your logo and a loading animation while the website loads. The splash screen hides automatically once the app is fully ready - no fixed timeframes!

## How It Works

### 1. **Native Splash Screen (Android)**
- Shows immediately when app launches
- Displays the splash image from `android/app/src/main/res/drawable*/splash.png`
- Shows a **large indigo spinner** below the logo (`#4f46e5` color)
- Stays visible until JavaScript tells it to hide

### 2. **HTML Splash Screen (Transition Layer)**
- Appears after native splash hides
- Shows your `/logo.png` with smooth zoom-in animation
- Shows modern CSS loading animation
- Ensures no white flash between native splash and app content

### 3. **Smart Hide Logic**
The splash screen hides when:
1. ✅ DOM is fully loaded
2. ✅ Next.js has hydrated (React is interactive)
3. ✅ Interactive elements exist (buttons, links, inputs)
4. ✅ Small buffer for smooth transition

**NO FIXED TIMEOUTS** - it waits for actual app readiness!

## Configuration Files

### `capacitor.config.ts`
```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 0,        // Infinite until manually hidden
    launchAutoHide: false,         // We control when to hide
    backgroundColor: "#ffffff",    // White background
    androidSplashResourceName: "splash",
    androidScaleType: "CENTER",    // Don't crop logo
    showSpinner: true,             // Show loading animation
    androidSpinnerStyle: "large",  // Large spinner
    iosSpinnerStyle: "large",
    spinnerColor: "#4f46e5",       // Indigo brand color
    splashFullScreen: true,
    splashImmersive: true,
  },
}
```

### `splash-screen-provider.tsx`
- Checks for DOM load completion
- Detects Next.js hydration by looking for interactive elements
- Uses `requestAnimationFrame` for smooth detection
- Includes fallback timeouts (10s for DOM, 5s for hydration)
- Smooth fade transitions between splash layers

## Customizing the Splash Screen

### Change the Logo
1. Replace `/public/logo.png` with your logo
2. Rebuild: `npm run build`
3. Sync: `npx cap sync android`

### Change Spinner Color
Edit `capacitor.config.ts`:
```typescript
spinnerColor: "#your-color-here"
```

### Change Background Color
Edit `capacitor.config.ts`:
```typescript
backgroundColor: "#your-bg-color"
```

### Generate New Splash Images
Use tools like:
- [capacitor-assets](https://github.com/ionic-team/capacitor-assets)
- [Capacitor Splash Generator](https://www.npmjs.com/package/@capacitor/assets)

Or manually create images for each density:
- `drawable-ldpi` (320x426)
- `drawable-mdpi` (320x470)
- `drawable-hdpi` (480x640)
- `drawable-xhdpi` (720x960)
- `drawable-xxhdpi` (960x1280)
- `drawable-xxxhdpi` (1280x1920)

## Testing

### In Android Studio
1. Build and sync: 
   ```bash
   npm run build
   npx cap sync android
   ```
2. Open in Android Studio
3. Run on emulator or device
4. **You should see:**
   - Native splash with logo and spinner immediately
   - Smooth transition to web content
   - No white flashes or delays

### Expected Behavior
✅ Splash shows instantly on launch  
✅ Loading spinner animates smoothly  
✅ Splash hides when app is ready (usually 2-5 seconds)  
✅ No fixed delays - adapts to network speed  
✅ Smooth transition to dashboard  

## Troubleshooting

### Splash doesn't hide
- Check browser console for errors
- Ensure `SplashScreenProvider` is in your layout
- Check that interactive elements exist after hydration

### White flash between splashes
- Increase the buffer time in `splash-screen-provider.tsx`
- Ensure logo image is optimized and loads quickly

### Spinner not showing
- Verify `showSpinner: true` in config
- Check spinner color contrasts with background
- Ensure you synced after config changes

## Build Commands

```bash
# Full rebuild and sync
npm run build
npx cap sync android

# Then open in Android Studio
```

## Technical Details

### Why Two Splash Screens?
1. **Native Splash**: Native Android cannot load HTML/CSS, so we use platform images
2. **HTML Splash**: Provides smooth transition and more control over animations

### Performance
- Native splash: Instant (built into APK)
- HTML splash: <500ms additional
- Total splash time: Depends on app load (2-5s typically)

### Files Modified
- `capacitor.config.ts` - Native splash configuration
- `src/components/providers/splash-screen-provider.tsx` - Smart hide logic
