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
      launchShowDuration: 3000,
      launchAutoHide: false, // വെബ്സൈറ്റ് ലോഡ് ആകുന്നത് വരെ നിൽക്കാൻ
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true, // സ്പിന്നർ കാണിക്കാൻ
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#4f46e5", // Purple Color
      splashFullScreen: true,
      splashImmersive: true,
      useDialog: true, // ഇത് സ്പിന്നർ വരാൻ സഹായിക്കും
    },
  },
};

export default config;
