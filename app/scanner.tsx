import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Stack, router } from "expo-router";
import { Camera, CameraType } from "expo-camera";
import { BarCodeScanner, BarCodeScannerResult } from "expo-barcode-scanner";
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

  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    checkPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: BarCodeScannerResult) => {
    setScanned(true);
    setScanning(false);

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
        <Text>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Scanner" }} />
        <Text>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
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
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />

      {scanning ? (
        <View style={styles.cameraContainer}>
          <Camera
            style={StyleSheet.absoluteFillObject}
            type={CameraType.BACK}
            barCodeScannerSettings={{
              barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
            }}
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
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
          </Camera>

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
              <Text style={styles.resultText}>{result}</Text>
              <TouchableOpacity style={styles.button} onPress={startScanning}>
                <Text style={styles.buttonText}>Scan Again</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.button} onPress={startScanning}>
              <Text style={styles.buttonText}>Start Scanning</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    flex: 1,
    width: "100%",
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
    height: 200,
  },
  scanWindow: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
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
  resultText: {
    color: "white",
    fontSize: 18,
    marginBottom: 30,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#0E7AFE",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
