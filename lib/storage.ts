import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { localStorage, isSSR } from "./web-storage-polyfill";

/**
 * Cross-platform storage adapter that works on both mobile and web
 * with additional safeguards for SSR environments
 */
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      // Handle SSR case first to avoid window not defined errors
      if (isSSR) {
        return null;
      } else if (Platform.OS === "web") {
        // Use polyfilled localStorage for web
        return localStorage.getItem(key);
      } else {
        // Use AsyncStorage for mobile
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error("Error getting item from storage", error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      // Skip storage operations during SSR
      if (isSSR) {
        return;
      } else if (Platform.OS === "web") {
        // Use polyfilled localStorage for web
        localStorage.setItem(key, value);
      } else {
        // Use AsyncStorage for mobile
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error("Error setting item in storage", error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      // Skip storage operations during SSR
      if (isSSR) {
        return;
      } else if (Platform.OS === "web") {
        // Use polyfilled localStorage for web
        localStorage.removeItem(key);
      } else {
        // Use AsyncStorage for mobile
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error("Error removing item from storage", error);
    }
  },

  async clear(): Promise<void> {
    try {
      // Skip storage operations during SSR
      if (isSSR) {
        return;
      } else if (Platform.OS === "web") {
        // Use polyfilled localStorage for web
        localStorage.clear();
      } else {
        // Use AsyncStorage for mobile
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.error("Error clearing storage", error);
    }
  },
};

export default storage;
