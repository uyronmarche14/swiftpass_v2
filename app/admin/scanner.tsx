import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

const QRScanner = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "QR Scanner",
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        <View style={styles.messageContainer}>
          <Ionicons name="qr-code" size={80} color={Colors.light.primary} />
          <Text style={styles.title}>QR Scanner</Text>
          <Text style={styles.message}>
            This is the QR scanner screen. We'll set up the camera in the next
            step.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              Alert.alert("Scanner", "Scanner would activate here.")
            }
          >
            <Text style={styles.buttonText}>Simulate Scan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default QRScanner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundAlt,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: Colors.light.text,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: Colors.light.textSecondary,
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
