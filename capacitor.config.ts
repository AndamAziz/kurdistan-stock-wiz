import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.cc2e0e7b48464abea6a60ee31dfedb3c',
  appName: 'kurdistan-stock-wiz',
  webDir: 'dist',
  server: {
    url: 'https://cc2e0e7b-4846-4abe-a6a6-0ee31dfedb3c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
