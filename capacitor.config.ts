import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'today.adh.app',
  appName: 'ADH CONNECT',
  webDir: 'public',
  appendUserAgent: 'ADH_APP',
  server: {
    // Production URL (Loads directly in WebView)
    url: 'https://adh.today',
    cleartext: true, // Only for debugging, optional in prod if https
    androidScheme: 'https',
    allowNavigation: [
      'adh.today',
      '*.adh.today',
      '*.google.com',
      '*.googleapis.com',
      '*.gstatic.com',
      '*.razorpay.com'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // Infinite duration until we manually hide it
      launchAutoHide: false, // We will manually hide it when the app is ready
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "large",
      spinnerColor: "#4f46e5",
      splashFullScreen: true,
      splashImmersive: true,
    },
    // Fullscreen video-ൽ status bar hide/show control ചെയ്യുക
    StatusBar: {
      style: "dark",           // Status bar text colour (dark = black icons)
      backgroundColor: "#000000",
      overlaysWebView: false,  // Status bar content-നെ push ചെയ്യും, overlay ചെയ്യില്ല
    },
  },
  // 2026 Performance: Android WebView optimization
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
