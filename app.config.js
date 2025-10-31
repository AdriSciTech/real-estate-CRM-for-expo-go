// app.config.js
import 'dotenv/config';

export default {
   expo: {
    name: "RealestateCRM (Expo Go)",
    slug: "realestatecrm-expo-go",
    version: "1.0.0",
    orientation: "portrait",
    sdkVersion: "54.0.0",
    platforms: ["ios", "android", "web"],
    assetBundlePatterns: ["**/*"]
  },
    ios: {
      bundleIdentifier: "com.adriansilva.realestatecrm", // ✅ required for EAS builds
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to capture property photos.",
        NSPhotoLibraryUsageDescription: "This app accesses your photo library to select property images."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.adriansilva.realestatecrm", // ✅ keep lowercase & consistent
      versionCode: 3,  // Increment for new build
      permissions: ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-secure-store"
    ],
    privacyPolicyUrl: "https://docs.google.com/document/d/1P_7T0UMAqESBp8L35IzdbvZVup2qNk2gz-OnkpDANgQ/edit?tab=t.0#heading=h.rvz5h1i9t2a8",
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://alandtpefmuoaxqwiets.supabase.co",
      supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_KEY || "sb_publishable_rwIpnRGZ71ejgulTMuhdxQ_T1bbopQ9",
      eas: {
        projectId: "b02b83f4-b0e8-4c92-8129-c45b58d38de6"
      }
    }
  }

