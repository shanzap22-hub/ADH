import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'today.adh.app',
  appName: 'ADH CONNECT',
  webDir: 'public',
  appendUserAgent: 'ADH_APP',
  server: {
    url: 'https://adh.today',
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // Infinite duration until we manually hide it
      launchAutoHide: false, // We will manually hide it when the app is ready
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#4f46e5",
      splashFullScreen: true,
      splashImmersive: true,
      useDialog: true,
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
