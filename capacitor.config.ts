import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'today.adh.app',
  appName: 'ADH CONNECT',
  webDir: 'public',
  appendUserAgent: 'ADH_APP',
  server: {
    url: 'https://adh.today',
    // androidScheme: 'https'
  }
};

export default config;
