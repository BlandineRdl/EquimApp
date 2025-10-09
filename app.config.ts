import * as dotenv from "dotenv";
import type { ExpoConfig } from "expo/config";

// Load environment variables
dotenv.config();

const config: ExpoConfig = {
	name: "EquimApp",
	slug: "equim-app",
	version: "1.0.0",
	orientation: "portrait",
	icon: "./assets/icon.png",
	userInterfaceStyle: "light",
	scheme: "equimapp",
	platforms: ["ios", "android"],
	plugins: ["expo-router", "expo-secure-store"],
	experiments: {
		typedRoutes: true,
	},
	extra: {
		router: {},
		eas: {
			projectId: "1adf1451-4c82-4e3f-a62c-868caade39b2",
		},
		// Expose Supabase environment variables
		EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
		EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
	},
	owner: "blackksun",
	android: {
		package: "com.blackksun.equimapp",
	},
	ios: {
		bundleIdentifier: "com.blackksun.equimapp",
		infoPlist: {
			ITSAppUsesNonExemptEncryption: false,
		},
	},
};

export default config;
