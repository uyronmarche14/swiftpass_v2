/**
 * Custom entry point for web exports
 *
 * This file configures the application for web export,
 * implementing workarounds for common SSR/SSG issues
 */

// Load polyfills first
import "./lib/web-storage-polyfill";
import "react-native-url-polyfill/auto";

// Import required modules
import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

// Configure global variables for web
if (typeof global.process === "undefined") {
  global.process = {
    env: {
      NODE_ENV: process.env.NODE_ENV || "development",
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  };
}

// Root app component that loads the router
export function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

// Register the root component
registerRootComponent(App);
