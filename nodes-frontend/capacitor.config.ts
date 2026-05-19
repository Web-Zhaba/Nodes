import { CapacitorConfig } from '@capacitor/cli';

const isLiveReload = process.env.CAPACITOR_LIVE_RELOAD === 'true';

const config: CapacitorConfig = {
  appId: 'com.nodes.app',
  appName: 'Nodes',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'https',
    ...(isLiveReload && {
      url: process.env.CAPACITOR_SERVER_URL || 'http://localhost:5173',
    }),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#030303',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#030303',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
    },
  },
};

export default config;
