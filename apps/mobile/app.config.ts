import type { ConfigContext, ExpoConfig } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "mobile",
  slug: "mobile",
  scheme: "mimicord",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    apiUrl: process.env.API_URL || "http://localhost:3000",
    eas: {
      projectId: "de6d6232-a7f4-4e2b-860e-8686e589830c", // Example/Placeholder - usually handled by eas init
    },
  },
})
