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
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsAuthenticated(true);
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error("Auth check error:", error);
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
      router.replace("/(tabs)");
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
    } catch (error: any) {
      console.error("Logout error:", error);
      Alert.alert("Logout Error", error.message || "Failed to logout");
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
        await fetchUserProfile(response.data.user.id);
        router.replace("/(tabs)");
        return true;
      } else {
        // If Supabase registration fails with a specific error, show it
        throw new Error(response.error || "Registration failed");
      }

      // Note: We've removed the backend API fallback since it's not working
      // and Supabase should handle all registrations directly
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

      try {
        // First try the backend API
        const response = await fetch(`${API_URL}/qr/generate/${user.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Add a timeout to fail faster if server is unreachable
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate QR code");
        }

        const data = await response.json();
        return data.qrCode;
      } catch (apiError) {
        console.warn(
          "Backend QR API unreachable, generating local QR data",
          apiError
        );

        // Fallback: Generate a simple QR code string with user data
        if (userProfile) {
          // Create a JSON object with essential user information
          const qrData = JSON.stringify({
            userId: user.id,
            email: user.email,
            fullName: userProfile.full_name,
            studentId: userProfile.student_id,
            course: userProfile.course || "Not Specified",
            timestamp: new Date().toISOString(),
            type: "local",
          });

          // Return the data to be encoded as QR
          return qrData;
        } else {
          throw new Error("User profile unavailable for QR code generation");
        }
      }
    } catch (error: unknown) {
      console.error("QR code error:", error);
      if (error instanceof Error) {
        Alert.alert("QR Code Error", error.message);
      } else {
        Alert.alert(
          "Error",
          "An unexpected error occurred while generating your QR code"
        );
      }
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        userProfile,
        login,
        logout,
        register,
        refreshUserProfile,
        getQRCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
