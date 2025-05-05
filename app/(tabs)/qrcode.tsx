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
  const [qrData, setQrData] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load QR code from backend
  const loadQRCode = useCallback(async () => {
    if (!userProfile) return;

    try {
      setQrLoading(true);
      const qrDataString = await getQRCode();
      if (qrDataString) {
        setQrValue(qrDataString);
        try {
          // Parse the QR data to display additional info
          const parsedData = JSON.parse(qrDataString);
          setQrData(parsedData);
        } catch (parseError) {
          console.error("Error parsing QR data:", parseError);
        }
      } else {
        // Fallback to generating QR code if backend fails
        const fallbackQrData = {
          userId: userProfile.id,
          studentId: userProfile.student_id,
          name: userProfile.full_name,
          course: userProfile.course || "Not Specified",
          section: userProfile.section || "Not Specified",
          timestamp: new Date().toISOString(),
          generated: "fallback",
        };
        setQrValue(JSON.stringify(fallbackQrData));
        setQrData(fallbackQrData);
      }
    } catch (error) {
      console.error("Error loading QR code:", error);
      // Fallback to client-side generation
      const fallbackQrData = {
        userId: userProfile.id,
        studentId: userProfile.student_id,
        name: userProfile.full_name,
        course: userProfile.course || "Not Specified",
        section: userProfile.section || "Not Specified",
        timestamp: new Date().toISOString(),
        generated: "fallback",
      };
      setQrValue(JSON.stringify(fallbackQrData));
      setQrData(fallbackQrData);
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

  // Format timestamp to readable format
  const formatDate = (timestamp: string) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (isLoading || (qrLoading && !refreshing)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading your QR code...</Text>
      </SafeAreaView>
    );
  }

  const hasCurrentLab =
    qrData?.currentLab !== null && qrData?.currentLab !== undefined;

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
              This QR code updates automatically with your current lab
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
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Section:</Text>
              <Text style={styles.infoValue}>
                {userProfile?.section || "Not specified"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={styles.infoValue}>
                {qrData?.timestamp
                  ? formatDate(qrData.timestamp)
                  : "Not available"}
              </Text>
            </View>
          </View>
        </View>

        {/* Current Lab Schedule Section */}
        <View style={styles.labScheduleSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons
              name="time-outline"
              size={20}
              color={Colors.light.primary}
            />{" "}
            Current Lab
          </Text>

          {hasCurrentLab ? (
            <View style={styles.currentLabCard}>
              <View style={styles.labHeader}>
                <Text style={styles.labName}>{qrData.currentLab.name}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active Now</Text>
                </View>
              </View>

              <View style={styles.labDetails}>
                <View style={styles.labDetailRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={Colors.light.icon}
                  />
                  <Text style={styles.labDetailText}>
                    {qrData.currentLab.day}
                  </Text>
                </View>
                <View style={styles.labDetailRow}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={Colors.light.icon}
                  />
                  <Text style={styles.labDetailText}>
                    {qrData.currentLab.time}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noLabContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={Colors.light.icon}
              />
              <Text style={styles.noLabText}>
                No lab session currently active
              </Text>
              <Text style={styles.noLabSubtext}>
                Your QR code will automatically update when you have a scheduled
                lab
              </Text>
            </View>
          )}
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
  labScheduleSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  currentLabCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fafafa",
  },
  labHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  labName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  statusBadge: {
    backgroundColor: Colors.light.success + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.success,
  },
  statusText: {
    color: Colors.light.success,
    fontSize: 12,
    fontWeight: "600",
  },
  labDetails: {
    marginTop: 8,
  },
  labDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labDetailText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  noLabContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  noLabText: {
    fontSize: 18,
    fontWeight: "500",
    color: Colors.light.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  noLabSubtext: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: "center",
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
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
});
