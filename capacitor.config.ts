import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fitgo.app",
  appName: "FitGo",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // tampil 3 detik
      launchAutoHide: true, // otomatis sembunyi
      backgroundColor: "#ffffff", // warna latar
      androidSplashResourceName: "splash", // nama file splash di drawable
      androidScaleType: "CENTER_CROP",
      showSpinner: false, // tidak pakai loading spinner
    },
  },
};

export default config;
