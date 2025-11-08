import Constants from "expo-constants";
import { logger } from "../logger";

const isExpoGo = Constants.appOwnership === "expo";

type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
} | null;

let SecureStore: SecureStoreModule = null;
if (!isExpoGo) {
  try {
    SecureStore = require("expo-secure-store");
  } catch (_e) {}
}

const memoryStorage = new Map<string, string>();

export const ExpoSecureStoreAdapter = {
  async getItem(key: string) {
    try {
      if (SecureStore && !isExpoGo) {
        return await SecureStore.getItemAsync(key);
      }
      const value = memoryStorage.get(key);
      return value || null;
    } catch (error) {
      logger.error("Error getting item from storage", error);
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      if (SecureStore && !isExpoGo) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
      memoryStorage.set(key, value);
    } catch (error) {
      logger.error("Error setting item in storage", error);
    }
  },
  async removeItem(key: string) {
    try {
      if (SecureStore && !isExpoGo) {
        await SecureStore.deleteItemAsync(key);
        return;
      }
      memoryStorage.delete(key);
    } catch (error) {
      logger.error("Error removing item from storage", error);
    }
  },
};
