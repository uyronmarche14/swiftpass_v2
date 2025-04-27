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
}

interface RegisterData {
  fullName: string;
  email: string;
  studentId: string;
  password: string;
}

// For development, use localhost with the correct port
const API_URL = "http://192.168.2.107:5000/api"; // For your local network
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
      if (user) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    }
  };

  const handleApiError = (error: any) => {
    console.error("API Error:", error);
    if (error.message === "Network request failed") {
      return "Unable to connect to the server. Please check if the server is running and try again.";
    }
    return error.message || "An unexpected error occurred";
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
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
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      setIsAuthenticated(true);
      router.replace("/login");
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
      setIsAuthenticated(false);
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, login, logout, register }}
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
