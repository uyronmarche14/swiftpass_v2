import React, { createContext, useContext, useState, useEffect } from "react";
import { router } from "expo-router";
import { Alert } from "react-native";

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

const AuthContext = createContext<AuthContextType | null>(null);

// Mock user data for testing
const mockUsers = [
  {
    email: "ronmarcheuy@gmail.com",
    password: "201114",
    fullName: "Test User",
    studentId: "STU123456",
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    console.log("Login attempt with:", { email, password });
    try {
      setIsLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if user exists in mock data
      const user = mockUsers.find(
        (u) => u.email === email && u.password === password
      );
      console.log("User found:", user);

      if (user) {
        setIsAuthenticated(true);
        console.log("Login successful, redirecting to dashboard");
        router.replace("/(tabs)/dashboard");
        return true;
      } else {
        console.log("Invalid credentials");
        Alert.alert("Login Error", "Invalid email or password");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login Error", "An unexpected error occurred");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if email already exists
      const userExists = mockUsers.some((u) => u.email === userData.email);

      if (userExists) {
        Alert.alert("Registration Error", "Email already exists");
        return false;
      }

      // Add new user to mock data
      mockUsers.push(userData);
      setIsAuthenticated(true);
      router.replace("/(tabs)/dashboard");
      return true;
    } catch (error) {
      Alert.alert("Registration Error", "An unexpected error occurred");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    router.replace("/login");
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
