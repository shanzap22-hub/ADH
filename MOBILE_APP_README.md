# ADH CONNECT - Mobile App Setup Guide

This project has been configured as a Hybrid Mobile App using **Capacitor**. It wraps the live website (`https://adh.today`) to provide a native experience on Android (and iOS).

## 📱 Features Implemented
- **Native Navigation**: Bottom Navigation Bar configured for mobile (Home/Dashboard, Courses, Live, Chat).
- **Account Deletion**: Added "Delete Account" feature in Profile to comply with Play Store policies.
- **No Address Bar**: Configured to run full-screen.
- **Deep Linking**: Maps `https://adh.today` to the app.

## 🛠️ Build Functionality
The app is configured to load the live URL `https://adh.today` by default. This means:
1. **Instant Updates**: Any change you deploy to Vercel/Web is immediately reflected in the app.
2. **Authentication**: Uses the same Supabase session.

### Prerequisite
Ensure you have **Android Studio** installed on your machine.

### 1. Generating Icons & Splash Screen
To replace the default Capacitor logo with "ADH CONNECT" logo:
1. Create a folder named `resources` in the root directory.
2. Add your `logo.png` (1024x1024) and `splash.png` (2732x2732) to the folder. (Or install `@capacitor/assets` and run generation).
   ```bash
   npm install @capacitor/assets --save-dev
   npx capacitor-assets generate --android
   ```

### 2. Building the APK
To open the Android project and build the app:
```bash
npx cap open android
```
This will launch Android Studio. From there:
1. Wait for Gradle Sync to finish.
2. Go to `Build > Build Bundle(s) / APK(s) > Build APK`.
3. Locate the APK in `android/app/build/outputs/apk/debug/app-debug.apk`.

### 3. Play Store Deployment
For Production Release:
1. Go to `Build > Generate Signed Bundle / APK`.
2. Select `Android App Bundle`.
3. Create a Key Store (keep this safe!).
4. Upload the generated `.aab` file to Google Play Console.

## ⚠️ Important Notes
- **Account Deletion**: The generic "Delete Account" button in `Profile` page performs a hard delete using Admin privileges. Proceed with caution.
- **Offline Mode**: Currently, the app requires internet access. True offline mode for video content requires a more complex "Download Manager" implementation.

## 📁 Configuration
- **capacitor.config.ts**: Main configuration file.
- **android/**: Native Android project files. Do not edit manually unless you know Android development.
