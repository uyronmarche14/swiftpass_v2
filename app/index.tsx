import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Colors } from "../constants/Colors";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function LandingPage() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.gradientStart, Colors.light.gradientEnd]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Image
            source={{
              uri: "https://res.cloudinary.com/ddnxfpziq/image/upload/v1746457773/security-shield--crime-security-security-shield_kgo0w9.png",
            }}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Lab Pass</Text>
          <Text style={styles.subtitle}>Secure Lab Access Management</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push("/register")}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Text style={styles.featureTitle}>Secure Access</Text>
              <Text style={styles.featureText}>
                QR-based authentication for lab entry
              </Text>
            </View>

            <View style={styles.feature}>
              <Text style={styles.featureTitle}>Real-time Tracking</Text>
              <Text style={styles.featureText}>
                Monitor lab attendance and access
              </Text>
            </View>

            <View style={styles.feature}>
              <Text style={styles.featureTitle}>Easy Management</Text>
              <Text style={styles.featureText}>
                Simple interface for lab administrators
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 24,
    tintColor: Colors.light.background,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: Colors.light.background,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: Colors.light.background,
    opacity: 0.9,
    marginBottom: 48,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
    marginBottom: 48,
  },
  button: {
    backgroundColor: Colors.light.background,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: Colors.light.primaryDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: Colors.light.primary,
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  secondaryButtonText: {
    color: Colors.light.background,
  },
  featuresContainer: {
    width: "100%",
    gap: 24,
  },
  feature: {
    backgroundColor: Colors.light.overlayLight,
    padding: 20,
    borderRadius: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  featureTitle: {
    color: Colors.light.background,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  featureText: {
    color: Colors.light.background,
    opacity: 0.8,
    fontSize: 14,
  },
});
