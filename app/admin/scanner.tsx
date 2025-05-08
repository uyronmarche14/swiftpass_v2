import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { supabase } from "../../lib/supabase";

interface ScanResult {
  userId?: string;
  studentId?: string;
  name?: string;
  course?: string;
  section?: string;
  timestamp?: string;
  currentDay?: string;
  currentTime?: string;
  currentLab?: {
    id?: string;
    name?: string;
    time?: string;
    day?: string;
  };
}

// Define proper types for the lab data
interface Lab {
  id: string;
  name: string;
  section: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface Enrollment {
  lab_id: string;
  labs: Lab;
}

const QRScanner = () => {
  const [facing, getFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [arduinoIpAddress, setArduinoIpAddress] = useState("192.168.137.220");
  const [arduinoConnected, setArduinoConnected] = useState(false);

  // Check Arduino connection on component mount and when IP changes
  useEffect(() => {
    checkArduinoConnection();
  }, [arduinoIpAddress]);

  const checkArduinoConnection = async () => {
    if (!arduinoIpAddress) return;

    try {
      console.log(
        `Checking Arduino connection at: http://${arduinoIpAddress}/status`
      );
      const response = await fetch(`http://${arduinoIpAddress}/status`, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Arduino connection successful:", data);
        setArduinoConnected(true);
        Alert.alert(
          "Connected",
          `Successfully connected to Arduino at ${arduinoIpAddress}`
        );
      } else {
        console.log("Arduino connection failed with status:", response.status);
        setArduinoConnected(false);
      }
    } catch (error) {
      console.error("Arduino connection error:", error);
      setArduinoConnected(false);
    }
  };

  // Signal Arduino about access status
  const signalArduino = async (granted: boolean, studentId: string) => {
    if (!arduinoIpAddress) {
      console.log("No Arduino IP address provided");
      return;
    }

    try {
      console.log(
        `Signaling Arduino at ${arduinoIpAddress} - Access ${
          granted ? "GRANTED" : "DENIED"
        } for student ${studentId}`
      );

      const qrCodeValue = granted ? "ACCESS123" : "INVALID";

      const response = await fetch(`http://${arduinoIpAddress}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrcode: qrCodeValue }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Arduino signal response:", data);
        return true;
      } else {
        console.error("Arduino signal failed with status:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error signaling Arduino:", error);
      return false;
    }
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to access the camera
        </Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const validateAttendance = async (data: ScanResult) => {
    try {
      setIsLoading(true);

      // Extract student ID from the QR data
      const studentId = data.userId || data.studentId;

      if (!studentId) {
        Alert.alert("Error", "Student ID not found in QR code");
        await signalArduino(false, "unknown");
        return;
      }

      // 1. Get current time and day
      const now = new Date();
      const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
      const currentTime = now.toLocaleTimeString("en-US", { hour12: false });

      // 2. Check if student exists and get their details
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, full_name, course, section")
        .eq("id", studentId)
        .single();

      if (studentError || !studentData) {
        console.error("Student lookup error:", studentError);
        Alert.alert(
          "Error",
          `Student not found in the database (ID: ${studentId})`
        );
        await signalArduino(false, studentId);
        return;
      }

      // If no lab info in QR code, find student's current lab
      let labId = data.currentLab?.id;

      if (!labId) {
        // Find student's current lab based on current day and time
        const { data: enrollments } = await supabase
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

        if (enrollments && enrollments.length > 0) {
          // Filter for current day labs
          const todayLabs = enrollments.filter((enrollment: any) => {
            // Ensure labs property exists and has day_of_week
            return (
              enrollment.labs &&
              typeof enrollment.labs === "object" &&
              enrollment.labs.day_of_week === currentDay
            );
          });

          if (todayLabs.length > 0) {
            // Find current time lab
            const currentTimeLabs = todayLabs.filter((enrollment: any) => {
              const lab = enrollment.labs;
              if (!lab || typeof lab !== "object") return false;

              const labStartTime = lab.start_time;
              const labEndTime = lab.end_time;

              if (!labStartTime || !labEndTime) return false;

              const [startHour, startMinute] = labStartTime.split(":");
              const [endHour, endMinute] = labEndTime.split(":");
              const [currHour, currMinute] = currentTime.split(":");

              const startTimeMinutes =
                parseInt(startHour) * 60 + parseInt(startMinute);
              const endTimeMinutes =
                parseInt(endHour) * 60 + parseInt(endMinute);
              const currTimeMinutes =
                parseInt(currHour) * 60 + parseInt(currMinute);

              return (
                currTimeMinutes >= startTimeMinutes &&
                currTimeMinutes <= endTimeMinutes
              );
            });

            if (currentTimeLabs.length > 0) {
              labId = currentTimeLabs[0].lab_id;
            } else {
              Alert.alert(
                "No Active Lab",
                "Student has no active lab at this time"
              );
              await signalArduino(false, studentId);
              return;
            }
          } else {
            Alert.alert(
              "No Lab Today",
              "Student has no labs scheduled for today"
            );
            await signalArduino(false, studentId);
            return;
          }
        } else {
          Alert.alert("Not Enrolled", "Student is not enrolled in any labs");
          await signalArduino(false, studentId);
          return;
        }
      }

      if (!labId) {
        Alert.alert("Error", "Could not determine lab session");
        await signalArduino(false, studentId);
        return;
      }

      // 3. Get lab details
      const { data: labData, error: labError } = await supabase
        .from("labs")
        .select(
          `
          id, name, section, day_of_week, start_time, end_time,
          subjects:subject_id (name, code)
        `
        )
        .eq("id", labId)
        .single();

      if (labError || !labData) {
        Alert.alert("Error", "Lab session not found");
        await signalArduino(false, studentId);
        return;
      }

      // 4. Validate day of week
      if (labData.day_of_week !== currentDay) {
        Alert.alert(
          "Invalid Day",
          `This lab is scheduled for ${labData.day_of_week}, not today (${currentDay})`
        );
        await signalArduino(false, studentId);
        return;
      }

      // 5. Validate time
      const [startHour, startMinute] = labData.start_time.split(":");
      const [endHour, endMinute] = labData.end_time.split(":");
      const [currentHour, currentMinute] = currentTime.split(":");

      const startTime = parseInt(startHour) * 60 + parseInt(startMinute);
      const endTime = parseInt(endHour) * 60 + parseInt(endMinute);
      const currentTimeInMinutes =
        parseInt(currentHour) * 60 + parseInt(currentMinute);

      if (currentTimeInMinutes < startTime || currentTimeInMinutes > endTime) {
        Alert.alert(
          "Invalid Time",
          `This lab is scheduled from ${labData.start_time} to ${labData.end_time}`
        );
        await signalArduino(false, studentId);
        return;
      }

      // 6. Check if student is enrolled in this lab
      const { data: enrollment, error: enrollmentError } = await supabase
        .from("student_labs")
        .select("id")
        .eq("student_id", studentId)
        .eq("lab_id", labId)
        .single();

      if (enrollmentError || !enrollment) {
        Alert.alert(
          "Not Enrolled",
          "Student is not enrolled in this lab session"
        );
        await signalArduino(false, studentId);
        return;
      }

      // 7. Check if attendance already recorded today
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingAttendance, error: existingError } = await supabase
        .from("attendance")
        .select("id, time_in")
        .eq("student_id", studentId)
        .eq("lab_id", labId)
        .gte("time_in", startOfDay.toISOString())
        .lte("time_in", endOfDay.toISOString())
        .maybeSingle();

      if (existingAttendance) {
        // Already attended today
        const timeIn = new Date(existingAttendance.time_in);
        Alert.alert(
          "Already Attended",
          `Attendance already recorded at ${timeIn.toLocaleTimeString()}`,
          [
            {
              text: "OK",
              onPress: async () => {
                // Still signal access granted since the student is valid
                await signalArduino(true, studentId);
              },
            },
          ]
        );
        return;
      }

      // 8. Record attendance
      const { error: attendanceError } = await supabase
        .from("attendance")
        .insert([
          {
            student_id: studentId,
            lab_id: labId,
            time_in: now.toISOString(),
          },
        ]);

      if (attendanceError) {
        console.error("Error recording attendance:", attendanceError);
        Alert.alert("Error", "Failed to record attendance");
        return;
      }

      // 9. Success!
      console.log(
        `Attendance recorded successfully for student ${studentId} in lab ${labId}`
      );

      // Safely extract the subject name with proper type checking
      let subjectName = "Unknown Course";
      try {
        if (labData.subjects) {
          if (Array.isArray(labData.subjects) && labData.subjects.length > 0) {
            const firstSubject = labData.subjects[0];
            if (
              firstSubject &&
              typeof firstSubject === "object" &&
              "name" in firstSubject
            ) {
              subjectName = String(firstSubject.name);
            }
          } else if (
            typeof labData.subjects === "object" &&
            labData.subjects !== null &&
            "name" in labData.subjects
          ) {
            subjectName = String(labData.subjects.name);
          }
        }
      } catch (err) {
        console.error("Error extracting subject name:", err);
      }

      Alert.alert(
        "Success",
        `Attendance recorded for ${studentData.full_name}\nLab: ${labData.name} (${subjectName})`
      );

      // Signal Arduino for access granted
      await signalArduino(true, studentId);
    } catch (error) {
      console.error("Error validating attendance:", error);
      Alert.alert("Error", "An unexpected error occurred");
      await signalArduino(false, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    console.log("QR code scanned:", data);
    try {
      // Try to parse the QR data
      const parsedData = JSON.parse(data);
      validateAttendance(parsedData);
    } catch (e) {
      console.error("Error parsing QR data:", e);
      Alert.alert("Invalid QR Code", "The QR code format is not recognized");
      signalArduino(false, "parse_error");
    }

    // Re-enable scanning after a delay
    setTimeout(() => setScanned(false), 3000);
  };

  const toggleCameraFacing = () => {
    getFacing((prev: string) => (prev === "back" ? "front" : "back"));
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      <View style={styles.ipContainer}>
        <Text style={styles.label}>Arduino IP Address:</Text>
        <TextInput
          style={styles.input}
          value={arduinoIpAddress}
          onChangeText={setArduinoIpAddress}
          placeholder="Enter ESP32 IP address"
          keyboardType="numeric"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[
            styles.connectButton,
            { backgroundColor: arduinoConnected ? "#4CAF50" : "#2196F3" },
          ]}
          onPress={checkArduinoConnection}
        >
          <Text style={styles.buttonText}>
            {arduinoConnected ? "Connected" : "Connect to Arduino"}
          </Text>
        </TouchableOpacity>
      </View>

      <CameraView
        style={styles.camera}
        facing={facing as "front" | "back"}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.buttonText}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    textAlign: "center",
    marginTop: 20,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
  },
  button: {
    backgroundColor: "black",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 10,
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
  ipContainer: {
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  connectButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
  },
});

export default QRScanner;
