import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import { Colors } from "../constants/Colors";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: Colors.light.background,
          },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="screening"
          options={{
            animation: "slide_from_right",
            presentation: "modal",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
