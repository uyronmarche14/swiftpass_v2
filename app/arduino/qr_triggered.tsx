// App.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

// Interface for scan result data
interface ScanResult {
  userId?: string;
  studentId?: string;
  name?: string;
  course?: string;
  section?: string;
  timestamp?: string;
}

// Extend UserProfile interface to include role
interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role?: string;
}

export default function ESP32Control() {
  const [ipAddress, setIpAddress] = useState("192.168.137.220");
  const [isOn, setIsOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const { userProfile } = useAuth();

  // Handle QR code scan
  const handleScan = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setIsLoading(true);

    try {
      // Parse QR code data
      let qrData: ScanResult;
      try {
        qrData = JSON.parse(data);
        console.log("QR Code data:", qrData);
      } catch (parseError) {
        console.error("Error parsing QR data:", parseError);
        Alert.alert("Invalid QR Code", "The QR code format is not recognized");
        await signalAccessDenied(ipAddress);
        setIsLoading(false);
        return;
      }

      // Extract student ID
      const studentId = qrData.userId || qrData.studentId;
      if (!studentId) {
        console.error("Student ID not found in QR code");
        Alert.alert("Error", "Student ID not found in QR code");
        await signalAccessDenied(ipAddress);
        setIsLoading(false);
        return;
      }

      // Get current time and day
      const now = new Date();
      const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
      const currentTime = now.toLocaleTimeString("en-US", { hour12: false });
      console.log("Current time:", currentTime, "Day:", currentDay);

      // Check if user is admin
      const isAdmin = (userProfile as UserProfile)?.role === "admin";
      console.log("User role:", (userProfile as UserProfile)?.role);

      // Get student data
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, full_name, course, section, role")
        .eq("id", studentId)
        .single();

      if (studentError || !studentData) {
        console.error("Student lookup error:", studentError);
        Alert.alert("Access Denied", "Student not found in database");
        await signalAccessDenied(ipAddress);
        setIsLoading(false);
        return;
      }

      console.log("Student data:", studentData);

      // If admin is scanning, grant access
      if (isAdmin) {
        console.log("Admin access granted");
        Alert.alert(
          "Access Granted",
          `Welcome Admin ${userProfile?.full_name}`
        );
        await signalAccessGranted(ipAddress);
        setIsLoading(false);
        return;
      }

      // Check if student has a scheduled lab at this time
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("student_labs")
        .select(
          `
          lab_id,
          labs!student_labs_lab_id_fkey (
            id, name, section, day_of_week, start_time, end_time
          )
        `
        )
        .eq("student_id", studentId);

      if (enrollmentError) {
        console.error("Error fetching enrollments:", enrollmentError);
        Alert.alert("Error", "Failed to check lab enrollments");
        await signalAccessDenied(ipAddress);
        setIsLoading(false);
        return;
      }

      if (!enrollments || enrollments.length === 0) {
        console.log("No lab enrollments found for student");
        Alert.alert("Access Denied", "Not enrolled in any labs");
        await signalAccessDenied(ipAddress);
        setIsLoading(false);
        return;
      }

      console.log("Student enrollments:", enrollments);

      // Filter for current day labs
      const todayLabs = enrollments.filter(
        (enrollment: any) =>
          enrollment.labs && enrollment.labs.day_of_week === currentDay
      );

      if (todayLabs.length === 0) {
        console.log("No labs scheduled for today");
        Alert.alert("Access Denied", "No lab scheduled for today");
        await signalAccessDenied(ipAddress);
        setIsLoading(false);
        return;
      }

      console.log("Today's labs:", todayLabs);

      // Find lab matching current time
      const currentLab = todayLabs.find((enrollment: any) => {
        const lab = enrollment.labs;
        if (!lab) return false;

        const [startHour, startMinute] = lab.start_time.split(":");
        const [endHour, endMinute] = lab.end_time.split(":");
        const [currHour, currMinute] = currentTime.split(":");

        const startTimeMinutes =
          parseInt(startHour) * 60 + parseInt(startMinute);
        const endTimeMinutes = parseInt(endHour) * 60 + parseInt(endMinute);
        const currTimeMinutes = parseInt(currHour) * 60 + parseInt(currMinute);

        return (
          currTimeMinutes >= startTimeMinutes &&
          currTimeMinutes <= endTimeMinutes
        );
      });

      if (!currentLab) {
        console.log("No active lab at current time");
        Alert.alert("Access Denied", "No active lab at this time");
        await signalAccessDenied(ipAddress);
        setIsLoading(false);
        return;
      }

      console.log("Current lab found:", currentLab);

      // If we got this far, access granted!
      console.log("Access granted for student:", studentData.full_name);
      Alert.alert("Access Granted", `Welcome ${studentData.full_name}`);

      // Signal Arduino to grant access
      await signalAccessGranted(ipAddress);
    } catch (error) {
      console.error("Error processing QR code:", error);
      Alert.alert("Error", "Failed to process QR code");
      await signalAccessDenied(ipAddress);
    } finally {
      setIsLoading(false);
      setTimeout(() => setScanned(false), 2000);
    }
  };

  // Function to signal access granted to ESP32
  const signalAccessGranted = async (deviceIp: string) => {
    try {
      console.log("Sending access granted signal to ESP32");
      const response = await fetch(`http://${deviceIp}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrcode: "ACCESS123" }),
      });

      if (response.ok) {
        console.log("Access granted signal sent successfully");
        setIsOn(true);
      } else {
        console.error("Failed to send access granted signal");
      }
    } catch (error) {
      console.error("Error signaling access granted:", error);
    }
  };

  // Function to signal access denied to ESP32
  const signalAccessDenied = async (deviceIp: string) => {
    try {
      console.log("Sending access denied signal to ESP32");
      const response = await fetch(`http://${deviceIp}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrcode: "INVALID" }),
      });

      if (response.ok) {
        console.log("Access denied signal sent successfully");
        setIsOn(false);
      } else {
        console.error("Failed to send access denied signal");
      }
    } catch (error) {
      console.error("Error signaling access denied:", error);
    }
  };

  // Toggle camera facing
  const toggleCameraFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  // Toggle scanner
  const toggleScanner = () => {
    setIsScannerActive(!isScannerActive);
    setScanned(false);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera permission required</Text>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: "#4CAF50" }]}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Access Control System</Text>

      <View style={styles.ipContainer}>
        <Text style={styles.label}>ESP32 IP Address:</Text>
        <TextInput
          style={styles.input}
          value={ipAddress}
          onChangeText={setIpAddress}
          placeholder="Enter ESP32 IP address"
          keyboardType="numeric"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Status: </Text>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isOn ? "#4CAF50" : "#F44336" },
          ]}
        />
        <Text style={styles.statusText}>{isOn ? "UNLOCKED" : "LOCKED"}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.scanButton,
          {
            backgroundColor: isScannerActive ? "#FF9800" : "#2196F3",
          },
        ]}
        onPress={toggleScanner}
      >
        <Text style={styles.buttonText}>
          {isScannerActive ? "Close Scanner" : "Open QR Scanner"}
        </Text>
      </TouchableOpacity>

      {isScannerActive && (
        <View style={styles.cameraContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}
          <CameraView
            style={styles.camera}
            facing={facing}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={scanned ? undefined : handleScan}
          >
            <View style={styles.overlay}>
              <View style={styles.scanArea} />
            </View>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <Text style={styles.flipButtonText}>Flip</Text>
            </TouchableOpacity>
          </CameraView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#2C3E50",
  },
  ipContainer: {
    width: "100%",
    marginBottom: 30,
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#7F8C8D",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 14,
    width: "100%",
    fontSize: 16,
    backgroundColor: "#F5F5F5",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginHorizontal: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#34495E",
  },
  scanButton: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  cameraContainer: {
    width: "100%",
    height: 350,
    overflow: "hidden",
    borderRadius: 16,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: "#3498DB",
    borderRadius: 15,
    backgroundColor: "transparent",
    shadowColor: "#3498DB",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  flipButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
  },
  flipButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    borderRadius: 16,
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
});
