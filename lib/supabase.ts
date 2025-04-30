import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration with fallback values
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://gvmrqjyyeruszhlddprq.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bXJxanl5ZXJ1c3pobGRkcHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MDczMzUsImV4cCI6MjA2MTM4MzMzNX0.WM2wftomZif174G4CrfSu6gd-GoGuU55LTiLEf9jwdw";

// Development check
if (__DEV__) {
  if (
    !process.env.EXPO_PUBLIC_SUPABASE_URL ||
    !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn(
      "⚠️ Using fallback Supabase configuration. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment variables."
    );
  }
}

// Create Supabase client with enhanced error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce", // Ensures no email confirmation needed for pkce flow
  },
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});

// Error handling wrapper for Supabase operations
export const handleSupabaseError = (error: any, operation: string) => {
  console.error(`❌ Supabase ${operation} error:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    timestamp: new Date().toISOString(),
  });

  // Return a standardized error response
  return {
    error: true,
    message: error.message || "An unexpected error occurred",
    code: error.code || "UNKNOWN_ERROR",
  };
};

// Success response wrapper
export const handleSupabaseSuccess = (data: any, operation: string) => {
  if (__DEV__) {
    console.log(`✅ Supabase ${operation} success:`, {
      data,
      timestamp: new Date().toISOString(),
    });
  }
  return { error: false, data };
};
