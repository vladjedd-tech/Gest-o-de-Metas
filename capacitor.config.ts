import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.metasmart.app',
  appName: 'MetaSmart',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
