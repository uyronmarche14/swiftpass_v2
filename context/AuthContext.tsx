import React, { createContext, useContext, useState, useEffect } from "react";
import { router } from "expo-router";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { AuthService } from "../lib/services/authService";
import {
  UserProfileService,
  UserProfile,
} from "../lib/services/userProfileService";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (
    email: string,
    password: string,
    fullName: string,
    studentId: string,
    course?: string
  ) => Promise<boolean>;
  refreshUserProfile: () => Promise<void>;
  getQRCode: () => Promise<string | null>;
}

interface RegisterData {
  fullName: string;
  email: string;
  studentId: string;
  password: string;
  course?: string;
}

// Use environment variable for API URL with more robust fallback
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"
    : "http://localhost:5000/api");

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      // First check if we have a stored session
      const storedSession = await AsyncStorage.getItem("session");
      const storedUser = await AsyncStorage.getItem("user");
      const storedProfile = await AsyncStorage.getItem("userProfile");

      if (storedSession && storedUser) {
        // We have stored credentials, let's restore the session
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);

        if (storedProfile) {
          setUserProfile(JSON.parse(storedProfile));
        } else {
          // If we have user but no profile, try to fetch it
          await fetchUserProfile(userData.id);
        }

        // Also verify with Supabase that the session is still valid
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          // If Supabase session is invalid, we need to refresh or log in again
          console.log("Stored session expired, attempting to refresh");
          const { error } = await supabase.auth.refreshSession();

          if (error) {
            console.error("Unable to refresh session:", error);
            // Force logout as the session is invalid
            await logout();
            return;
          }
        }
      } else {
        // Check if Supabase has a valid session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setIsAuthenticated(true);
          setUser(session.user);
          await fetchUserProfile(session.user.id);

          // Store the session for future app launches
          await AsyncStorage.setItem("user", JSON.stringify(session.user));
          await AsyncStorage.setItem("session", JSON.stringify(session));
        } else {
          // No valid session found
          setIsAuthenticated(false);
          setUser(null);
          setUserProfile(null);
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // If there's an error during auth check, reset to logged out state
      setIsAuthenticated(false);
      setUser(null);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for userId:", userId);
      const response = await UserProfileService.getUserProfile(userId);

      if (response.success && response.data) {
        console.log("User profile fetched successfully:", {
          id: response.data.id,
          email: response.data.email,
          full_name: response.data.full_name,
          student_id: response.data.student_id,
          course: response.data.course,
        });

        setUserProfile(response.data);
        await AsyncStorage.setItem(
          "userProfile",
          JSON.stringify(response.data)
        );
      } else {
        console.warn("Failed to fetch user profile:", response.error);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await AuthService.login(email, password);

      if (!response.success) {
        throw new Error(response.error || "Login failed");
      }

      // Store session and user data
      await Promise.all([
        AsyncStorage.setItem("user", JSON.stringify(response.data.user)),
        AsyncStorage.setItem("session", JSON.stringify(response.data.session)),
      ]);

      setUser(response.data.user);
      setIsAuthenticated(true);
      await fetchUserProfile(response.data.user.id);
      router.replace("/(tabs)/dashboard");
      return true;
    } catch (error: unknown) {
      console.error("Login error:", error);

      if (error instanceof Error) {
        if (error.message.includes("Network request failed")) {
          Alert.alert(
            "Connection Error",
            "Unable to connect to the authentication server. Please check your internet connection and try again."
          );
        } else {
          Alert.alert("Login Error", error.message);
        }
      } else {
        Alert.alert("Error", "An unexpected error occurred during login");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      const response = await AuthService.logout();

      if (!response.success) {
        throw new Error(response.error || "Logout failed");
      }

      setIsAuthenticated(false);
      setUser(null);
      setUserProfile(null);

      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("userProfile");
      await AsyncStorage.removeItem("session");

      router.replace("/login");
      return true;
    } catch (error: any) {
      console.error("Logout error:", error);
      Alert.alert("Logout Error", error.message || "Failed to logout");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    studentId: string,
    course?: string
  ) => {
    try {
      setIsLoading(true);

      console.log("Registering user:", { email, fullName, studentId, course });

      // Use Supabase registration as primary method
      const response = await AuthService.register({
        email,
        password,
        fullName,
        studentId,
        course,
      });

      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);

        // After successful registration and user creation
        await fetchUserProfile(response.data.user.id);

        // Generate and store QR code data for the user
        // This happens only once at registration time
        await createUserQRCode(
          response.data.user.id,
          fullName,
          studentId,
          course
        );

        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        await AsyncStorage.setItem(
          "session",
          JSON.stringify(response.data.session)
        );

        router.replace("/login");
        return true;
      } else {
        // If Supabase registration fails with a specific error, show it
        throw new Error(response.error || "Registration failed");
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        if (error.message.includes("Network request failed")) {
          Alert.alert(
            "Connection Error",
            "Unable to connect to the authentication server. Please check your internet connection and try again."
          );
        } else {
          Alert.alert("Registration Error", error.message);
        }
      } else {
        Alert.alert(
          "Error",
          "An unexpected error occurred during registration"
        );
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a QR code entry for the new user - only happens once at registration
  const createUserQRCode = async (
    userId: string,
    fullName: string,
    studentId: string,
    course?: string
  ) => {
    try {
      // Create QR code data
      const qrData = {
        userId: userId,
        studentId: studentId,
        name: fullName,
        course: course || "Not Specified",
      };

      // Insert the QR code data into the qr_codes table
      const { error } = await supabase.from("qr_codes").insert([
        {
          student_id: userId,
          qr_data: qrData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Error creating QR code:", error);
        return false;
      }

      console.log("QR code created successfully for user:", userId);
      return true;
    } catch (error) {
      console.error("Failed to create QR code:", error);
      return false;
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const getQRCode = async () => {
    try {
      if (!user) {
        Alert.alert("Error", "You need to be logged in to get a QR code");
        return null;
      }

      // First check if user has a QR code in the database
      const { data: qrCodeData, error: qrError } = await supabase
        .from("qr_codes")
        .select("qr_data")
        .eq("student_id", user.id)
        .single();

      if (qrError) {
        // If no QR code exists, create one (this should only happen for existing accounts before this update)
        if (qrError.code === "PGRST116" && userProfile) {
          // No QR code found, create a new permanent one
          const success = await createUserQRCode(
            user.id,
            userProfile.full_name,
            userProfile.student_id,
            userProfile.course
          );

          if (success) {
            // Try to get the newly created QR code
            const { data: newQrData, error: newQrError } = await supabase
              .from("qr_codes")
              .select("qr_data")
              .eq("student_id", user.id)
              .single();

            if (newQrError) {
              throw new Error("Failed to retrieve newly created QR code");
            }

            return JSON.stringify(newQrData.qr_data);
          } else {
            throw new Error("Failed to create QR code");
          }
        } else {
          throw new Error("Error retrieving QR code: " + qrError.message);
        }
      }

      // Return the user's permanent QR code data
      return JSON.stringify(qrCodeData.qr_data);
    } catch (error: unknown) {
      console.error("QR code error:", error);
      if (error instanceof Error) {
        Alert.alert("QR Code Error", error.message);
      } else {
        Alert.alert(
          "Error",
          "An unexpected error occurred while retrieving your QR code"
        );
      }
      return null;
    }
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    userProfile,
    login,
    logout,
    register,
    refreshUserProfile,
    getQRCode,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
