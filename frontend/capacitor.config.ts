import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agrishield.app',
  appName: 'AgriShield',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
