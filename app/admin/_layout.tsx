import React from "react";
import { Stack } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Text, View, ActivityIndicator } from "react-native";
import { Colors } from "../../constants/Colors";

export default function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={{ marginTop: 16, color: Colors.light.text }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Redirect non-admin users (handled in AuthContext for navigation)

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.primary,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Admin Dashboard",
        }}
      />
      <Stack.Screen
        name="students"
        options={{
          title: "Manage Students",
        }}
      />
      <Stack.Screen
        name="labs"
        options={{
          title: "Manage Labs",
        }}
      />
      <Stack.Screen
        name="courses"
        options={{
          title: "Manage Courses",
        }}
      />
      <Stack.Screen
        name="attendance"
        options={{
          title: "Attendance Records",
        }}
      />
      <Stack.Screen
        name="sections"
        options={{
          title: "Manage Sections",
        }}
      />
      <Stack.Screen
        name="schedules"
        options={{
          title: "Manage Schedules",
        }}
      />
      <Stack.Screen
        name="scanner"
        options={{
          title: "QR Scanner",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
