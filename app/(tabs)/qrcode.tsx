import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import QRCode from "react-native-qrcode-svg";
import * as Haptics from "expo-haptics";

export default function QRCodeScreen() {
  const { userProfile, isLoading, getQRCode } = useAuth();
  const [qrValue, setQrValue] = useState("");
  const [qrLoading, setQrLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load QR code from backend
  const loadQRCode = useCallback(async () => {
    if (!userProfile) return;

    try {
      setQrLoading(true);
      const qrData = await getQRCode();
      if (qrData) {
        setQrValue(qrData);
      } else {
        // Fallback to generating QR code if backend fails
        const fallbackQrData = {
          userId: userProfile.id,
          studentId: userProfile.student_id,
          name: userProfile.full_name,
          course: userProfile.course || "Not Specified",
        };
        setQrValue(JSON.stringify(fallbackQrData));
      }
    } catch (error) {
      console.error("Error loading QR code:", error);
      // Fallback to client-side generation
      const fallbackQrData = {
        userId: userProfile.id,
        studentId: userProfile.student_id,
        name: userProfile.full_name,
        course: userProfile.course || "Not Specified",
      };
      setQrValue(JSON.stringify(fallbackQrData));
    } finally {
      setQrLoading(false);
    }
  }, [userProfile, getQRCode]);

  // Set QR code on load
  useEffect(() => {
    if (userProfile) {
      loadQRCode();
    }
  }, [userProfile, loadQRCode]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQRCode();
    setRefreshing(false);
  }, [loadQRCode]);

  // Request emergency access
  const requestEmergencyAccess = () => {
    Alert.alert(
      "Emergency Access Request",
      "Do you want to request emergency access?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Request",
          onPress: () => {
            Alert.alert(
              "Request Sent",
              "Your emergency access request has been sent to administrators. Please wait for approval."
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          style: "default",
        },
      ]
    );
  };

  if (isLoading || (qrLoading && !refreshing)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading your QR code...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Lab Access QR Code</Text>
          <Text style={styles.subtitle}>
            Use this QR code for lab access and attendance
          </Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.infoNote}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={Colors.light.info}
            />
            <Text style={styles.infoText}>
              This QR code is permanently linked to your account
            </Text>
          </View>

          <View style={styles.qrCodeWrapper}>
            {qrValue ? (
              <QRCode
                value={qrValue}
                size={250}
                color="#000"
                backgroundColor="#fff"
                logoBackgroundColor="#fff"
              />
            ) : (
              <ActivityIndicator size="large" color={Colors.light.primary} />
            )}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID:</Text>
              <Text style={styles.infoValue}>{userProfile?.student_id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{userProfile?.full_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Course:</Text>
              <Text style={styles.infoValue}>
                {userProfile?.course || "Not specified"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.emergencyContainer}>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={requestEmergencyAccess}
          >
            <Ionicons name="alert-circle-outline" size={20} color="#fff" />
            <Text style={styles.emergencyButtonText}>
              Request Emergency Access
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  qrContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 24,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.light.info}10`,
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.info,
    marginLeft: 8,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  infoContainer: {
    width: "100%",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  infoLabel: {
    width: 60,
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  emergencyContainer: {
    marginBottom: 20,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.error,
    marginBottom: 16,
  },
  emergencyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
});
