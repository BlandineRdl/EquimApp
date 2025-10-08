/**
 * Storage adapter for Supabase
 * - Development Build: Uses expo-secure-store (persistent storage)
 * - Expo Go: Uses in-memory storage (sessions don't persist)
 */
import Constants from "expo-constants";

// Check if we're in a Development Build or Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Dynamic import of SecureStore (only works in Development Build)
let SecureStore: any = null;
if (!isExpoGo) {
	try {
		SecureStore = require("expo-secure-store");
	} catch (e) {
		console.warn("expo-secure-store not available, using in-memory storage");
	}
}

// In-memory fallback for Expo Go
const memoryStorage = new Map<string, string>();

export const ExpoSecureStoreAdapter = {
	async getItem(key: string) {
		try {
			// Use SecureStore in Development Build
			if (SecureStore && !isExpoGo) {
				return await SecureStore.getItemAsync(key);
			}
			// Fallback to memory storage in Expo Go
			const value = memoryStorage.get(key);
			return value || null;
		} catch (error) {
			console.error("Error getting item from storage:", error);
			return null;
		}
	},
	async setItem(key: string, value: string) {
		try {
			// Use SecureStore in Development Build
			if (SecureStore && !isExpoGo) {
				await SecureStore.setItemAsync(key, value);
				return;
			}
			// Fallback to memory storage in Expo Go
			memoryStorage.set(key, value);
		} catch (error) {
			console.error("Error setting item in storage:", error);
		}
	},
	async removeItem(key: string) {
		try {
			// Use SecureStore in Development Build
			if (SecureStore && !isExpoGo) {
				await SecureStore.deleteItemAsync(key);
				return;
			}
			// Fallback to memory storage in Expo Go
			memoryStorage.delete(key);
		} catch (error) {
			console.error("Error removing item from storage:", error);
		}
	},
};
