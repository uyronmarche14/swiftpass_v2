import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

interface ScanData {
  name?: string;
  studentId?: string;
  course?: string;
  currentLab?: {
    id?: string;
    name?: string;
  };
}

export default function Scanner() {
  const [scanned, setScanned] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    const checkPermissions = async () => {
      if (permission?.granted) {
        setHasPermission(true);
      } else {
        const { granted } = await requestPermission();
        setHasPermission(granted);
      }
    };

    checkPermissions();
  }, [permission]);

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);
    setScanning(false);
    setLoading(true);

    try {
      // Try to parse the QR data as JSON
      const parsedData: ScanData = JSON.parse(data);
      setResult(
        `Student: ${parsedData.name || "Unknown"}\n` +
          `ID: ${parsedData.studentId || "Unknown"}\n` +
          `Course: ${parsedData.course || "Unknown"}\n` +
          `Lab: ${parsedData.currentLab?.name || "Unknown"}`
      );

      // Here you would process the attendance
      recordAttendance(parsedData);
    } catch (error) {
      // If it's not valid JSON, just show the raw data
      setResult(`Scanned: ${data}`);
    } finally {
      setLoading(false);
    }
  };

  const recordAttendance = async (data: ScanData) => {
    // This would be the actual implementation to record attendance
    // For now it's just a placeholder
    console.log("Recording attendance for:", data);

    // Actual implementation would involve Supabase calls similar to:
    /*
    const { error } = await supabase
      .from('attendance')
      .insert([
        { 
          student_id: data.studentId, 
          lab_id: data.currentLab?.id,
          time_in: new Date().toISOString() 
        }
      ]);
    */
  };

  const startScanning = () => {
    setScanned(false);
    setScanning(true);
    setResult(null);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Scanner" }} />
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Scanner" }} />
        <Ionicons name="camera-outline" size={50} color="#7F8C8D" />
        <Text style={styles.noAccessText}>No access to camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => requestPermission()}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "QR Scanner",
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#3498DB" />
            </TouchableOpacity>
          ),
        }}
      />

      {scanning ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.unfilled} />
              <View style={styles.rowContainer}>
                <View style={styles.unfilled} />
                <View style={styles.scanWindow} />
                <View style={styles.unfilled} />
              </View>
              <View style={styles.unfilled} />
            </View>

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
          </CameraView>

          {scanned && (
            <View style={styles.scanAgainContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.buttonText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.resultContainer}>
          {result ? (
            <>
              <View style={styles.resultCard}>
                <Ionicons
                  name="checkmark-circle"
                  size={50}
                  color="#2ecc71"
                  style={styles.resultIcon}
                />
                <Text style={styles.resultText}>{result}</Text>
              </View>
              <TouchableOpacity style={styles.button} onPress={startScanning}>
                <Text style={styles.buttonText}>Scan Again</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.startScanContent}>
                <Ionicons
                  name="qr-code"
                  size={100}
                  color="#3498DB"
                  style={styles.qrIcon}
                />
                <Text style={styles.startText}>
                  Ready to scan attendance QR codes
                </Text>
              </View>
              <TouchableOpacity style={styles.button} onPress={startScanning}>
                <Text style={styles.buttonText}>Start Scanning</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  headerButton: {
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    borderRadius: 16,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  unfilled: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  rowContainer: {
    flexDirection: "row",
    height: 220,
  },
  scanWindow: {
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
  scanAgainContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    padding: 20,
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultIcon: {
    marginBottom: 16,
  },
  resultText: {
    color: "#2C3E50",
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
  },
  startScanContent: {
    alignItems: "center",
    marginBottom: 30,
  },
  qrIcon: {
    marginBottom: 20,
  },
  startText: {
    fontSize: 18,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#3498DB",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  secondaryButtonText: {
    color: "#34495E",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  noAccessText: {
    fontSize: 18,
    color: "#34495E",
    marginVertical: 20,
    textAlign: "center",
  },
});
