import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fitgo.app",
  appName: "FitGo",
  webDir: "dist",
  android: {
    webContentsDebuggingEnabled: true,
    backgroundColor: '#ffffffff',
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "ic_launcher",
      androidScaleType: "FIT_CENTER",
      showSpinner: false,
    },
  },
};

export default config;
