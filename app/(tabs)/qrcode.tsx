import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Share,
  Alert,
  Platform,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Colors } from "../../constants/Colors";
import QRCode from "react-native-qrcode-svg";
import * as Haptics from "expo-haptics";

// QR code validity in seconds
const QR_CODE_VALIDITY = 60;

export default function QRCodeScreen() {
  const { userProfile, isLoading } = useAuth();
  const [qrValue, setQrValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(QR_CODE_VALIDITY);
  const [qrLoading, setQrLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const qrRef = useRef<QRCode>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check media library permissions
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionGranted(status === "granted");
    })();
  }, []);

  // Generate QR code data
  const generateQRData = useCallback(() => {
    if (!userProfile) return "";

    // Create a unique QR code with timestamp and user data
    const qrData = {
      userId: userProfile.id,
      studentId: userProfile.student_id,
      name: userProfile.full_name,
      timestamp: new Date().toISOString(),
      validUntil: new Date(Date.now() + QR_CODE_VALIDITY * 1000).toISOString(),
      randomToken: Math.random().toString(36).substring(2, 15),
    };

    return JSON.stringify(qrData);
  }, [userProfile]);

  // Generate new QR code
  const generateNewQR = useCallback(() => {
    setQrLoading(true);
    const newQrValue = generateQRData();
    setQrValue(newQrValue);
    setTimeLeft(QR_CODE_VALIDITY);
    setQrLoading(false);
    // Provide haptic feedback on QR refresh
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [generateQRData]);

  // Initialize QR code on load
  useEffect(() => {
    if (userProfile) {
      generateNewQR();
    }
  }, [userProfile, generateNewQR]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft <= 0) {
      generateNewQR();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, generateNewQR]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    generateNewQR();
    setRefreshing(false);
  }, [generateNewQR]);

  // Save QR code to device gallery
  const saveQRToGallery = async () => {
    try {
      if (!permissionGranted) {
        Alert.alert(
          "Permission Required",
          "Please grant storage permission to save QR code"
        );
        return;
      }

      if (!qrRef.current) return;

      // Convert QR code to image
      qrRef.current.toDataURL(async (data: string) => {
        const fileUri = FileSystem.documentDirectory + "swiftpass_qrcode.png";
        await FileSystem.writeAsStringAsync(fileUri, data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync("SwiftPass", asset, false);

        Alert.alert("Success", "QR code saved to gallery");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    } catch (error) {
      console.error("Error saving QR code:", error);
      Alert.alert("Error", "Failed to save QR code to gallery");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Share QR code
  const shareQRCode = async () => {
    try {
      if (!qrRef.current) return;

      qrRef.current.toDataURL(async (data: string) => {
        const fileUri = FileSystem.documentDirectory + "swiftpass_qrcode.png";
        await FileSystem.writeAsStringAsync(fileUri, data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Share.share({
          title: "My SwiftPass QR Code",
          url: Platform.OS === "ios" ? fileUri : `file://${fileUri}`,
        });
      });
    } catch (error) {
      console.error("Error sharing QR code:", error);
      Alert.alert("Error", "Failed to share QR code");
    }
  };

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
        <Text style={styles.loadingText}>Generating secure QR code...</Text>
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
          <Text style={styles.title}>Your Access QR Code</Text>
          <Text style={styles.subtitle}>
            Use this QR code for lab access and attendance
          </Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.validityContainer}>
            <Text style={styles.validityText}>Valid for: </Text>
            <Text
              style={[styles.timer, timeLeft < 10 ? styles.timerWarning : null]}
            >
              {timeLeft}s
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
                getRef={(ref) => (qrRef.current = ref)}
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

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={generateNewQR}>
            <Ionicons name="refresh" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={saveQRToGallery}
          >
            <Ionicons name="save" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={shareQRCode}>
            <Ionicons name="share" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={requestEmergencyAccess}
        >
          <Ionicons name="warning" size={22} color="#fff" />
          <Text style={styles.emergencyButtonText}>
            Request Emergency Access
          </Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons
              name="information-circle"
              size={22}
              color={Colors.light.primary}
            />
            <Text style={styles.infoCardTitle}>How to use your QR Code</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="time-outline"
              size={18}
              color={Colors.light.primary}
            />
            <Text style={styles.infoText}>
              QR code refreshes automatically every minute for security
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="scan-outline"
              size={18}
              color={Colors.light.primary}
            />
            <Text style={styles.infoText}>
              Scan at lab entrance to record attendance
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={Colors.light.primary}
            />
            <Text style={styles.infoText}>
              Each code is unique and valid for a limited time
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={Colors.light.primary}
            />
            <Text style={styles.infoText}>
              Use emergency access only when necessary
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    marginTop: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  qrContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  validityContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#f0f4f9",
    padding: 10,
    borderRadius: 10,
  },
  validityText: {
    fontSize: 16,
    color: "#555",
  },
  timer: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  timerWarning: {
    color: Colors.light.warning,
  },
  qrCodeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
    height: 280,
    width: "100%",
  },
  infoContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    width: 60,
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 6,
  },
  emergencyButton: {
    backgroundColor: Colors.light.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  emergencyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginLeft: 10,
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
    flex: 1,
  },
});
