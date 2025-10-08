/**
 * Storage adapter for Supabase
 * - Development Build: Uses expo-secure-store (persistent storage)
 * - Expo Go: Uses in-memory storage (sessions don't persist)
 */
import Constants from "expo-constants";
import { logger } from "../logger";

// Check if we're in a Development Build or Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Define SecureStore type based on expo-secure-store
type SecureStoreModule = {
	getItemAsync: (key: string) => Promise<string | null>;
	setItemAsync: (key: string, value: string) => Promise<void>;
	deleteItemAsync: (key: string) => Promise<void>;
} | null;

// Dynamic import of SecureStore (only works in Development Build)
let SecureStore: SecureStoreModule = null;
if (!isExpoGo) {
	try {
		SecureStore = require("expo-secure-store");
	} catch (e) {
		// Silent: Expected in Expo Go, fallback to in-memory storage
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
			logger.error("Error getting item from storage", error);
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
			logger.error("Error setting item in storage", error);
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
			logger.error("Error removing item from storage", error);
		}
	},
};
