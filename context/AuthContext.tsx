import React, { createContext, useContext, useState, useEffect } from "react";
import { router } from "expo-router";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  apiRequest: <T>(endpoint: string, method?: string, data?: any) => Promise<T>;
}

interface RegisterData {
  fullName: string;
  email: string;
  studentId: string;
  password: string;
  course?: string;
}

// For development, use localhost with the correct port
const API_URL = "http://192.168.137.1:5000/api"; // For your local network
// const API_URL = "http://10.0.2.2:5000/api"; // For Android emulator
// const API_URL = "http://localhost:5000/api"; // For iOS simulator

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("token");

      if (user && token) {
        setIsAuthenticated(true);
        // Redirect to dashboard if not already there
        // We can't check current route directly, so we use try/catch when replacing
        try {
          router.replace("/(tabs)/dashboard");
        } catch (e) {
          // Already on dashboard, ignore the error
          console.log("Already on dashboard, continuing...");
        }
      } else {
        // Not authenticated, ensure token is cleared
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
    }
  };

  const handleApiError = (error: any) => {
    console.error("API Error:", error);

    // Network connection errors
    if (error.message === "Network request failed") {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    // Authentication errors
    if (
      error.message?.includes("auth") ||
      error.message?.includes("login") ||
      error.message?.includes("password") ||
      error.message?.includes("email")
    ) {
      return error.message;
    }

    // Registration errors
    if (
      error.message?.includes("register") ||
      error.message?.includes("sign up") ||
      error.message?.includes("exists")
    ) {
      return error.message;
    }

    // Server errors
    if (error.message?.includes("500") || error.message?.includes("server")) {
      return "The server encountered an error. Please try again later.";
    }

    return error.message || "An unexpected error occurred";
  };

  // Simple function to check if the server is reachable
  const checkServerConnection = async (): Promise<boolean> => {
    try {
      // Timeout after 5 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Try to reach the server with a HEAD request
      const response = await fetch(`${API_URL}/health`, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log("Server connection check failed:", error);
      return false;
    }
  };

  // Enhanced apiRequest with connection check
  const apiRequest = async <T,>(
    endpoint: string,
    method: string = "GET",
    data?: any
  ): Promise<T> => {
    try {
      // Check server connection first
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        throw new Error("Network request failed");
      }

      const token = await AsyncStorage.getItem("token");
      const url = `${API_URL}${endpoint}`;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (
        data &&
        (method === "POST" || method === "PUT" || method === "PATCH")
      ) {
        options.body = JSON.stringify(data);
      }

      console.log(`API Request: ${method} ${url}`);
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            `API request failed with status ${response.status}`
        );
      }

      return responseData as T;
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error(`API Request Error: ${errorMessage}`);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("Attempting login with email:", email);

      const responseData = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      }).then((response) => {
        console.log("Login response status:", response.status);
        return response.json().then((data) => {
          if (!response.ok) {
            throw new Error(data.error || "Login failed");
          }
          return data;
        });
      });

      console.log("Login successful:", JSON.stringify(responseData));

      // Store both user and token
      await AsyncStorage.setItem("user", JSON.stringify(responseData.user));
      await AsyncStorage.setItem("token", responseData.token);

      setIsAuthenticated(true);
      router.replace("/(tabs)/dashboard");
      return true;
    } catch (error) {
      const errorMessage = handleApiError(error);
      Alert.alert("Login Error", errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      console.log("Attempting registration with:", JSON.stringify(userData));

      const responseData = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(userData),
      }).then((response) => {
        console.log("Registration response status:", response.status);
        return response.json().then((data) => {
          if (!response.ok) {
            throw new Error(data.error || "Registration failed");
          }
          return data;
        });
      });

      console.log("Registration successful:", JSON.stringify(responseData));

      // Store both user and token
      await AsyncStorage.setItem("user", JSON.stringify(responseData.user));
      await AsyncStorage.setItem("token", responseData.token);

      Alert.alert(
        "Registration Successful",
        "Your account has been created successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              setIsAuthenticated(true);
              router.replace("/login");
            },
          },
        ]
      );
      return true;
    } catch (error) {
      const errorMessage = handleApiError(error);
      Alert.alert("Registration Error", errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");
      setIsAuthenticated(false);
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
        apiRequest,
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
