import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Text,
  ActivityIndicator,
  Image,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { CustomButton } from "./CustomButton";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";

interface QRCodeGeneratorProps {
  isVisible: boolean;
  onClose: () => void;
}

interface StudentData {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  course: string;
  year: string;
  schedules: Array<{
    lab_name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  }>;
}

export function QRCodeGenerator({ isVisible, onClose }: QRCodeGeneratorProps) {
  const { userProfile } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVisible && userProfile) {
      fetchSchedules();
    }
  }, [isVisible, userProfile]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", userProfile.id);

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const studentData: StudentData = {
    id: userProfile?.id || "",
    studentId: userProfile?.student_id || "",
    fullName: userProfile?.full_name || "",
    email: userProfile?.email || "",
    course: userProfile?.course || "Not specified",
    year: userProfile?.year || "Not specified",
    schedules: schedules,
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Student ID Card</Text>
            <Ionicons
              name="close"
              size={24}
              color={Colors.light.icon}
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.light.primary} />
          ) : (
            <>
              <View style={styles.card}>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={JSON.stringify(studentData)}
                    size={200}
                    backgroundColor="white"
                    color={Colors.light.text}
                  />
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userProfile?.full_name}</Text>
                  <Text style={styles.studentId}>
                    ID: {userProfile?.student_id}
                  </Text>
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="school"
                      size={16}
                      color={Colors.light.icon}
                    />
                    <Text style={styles.infoText}>{userProfile?.course}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar"
                      size={16}
                      color={Colors.light.icon}
                    />
                    <Text style={styles.infoText}>
                      Year {userProfile?.year}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.scheduleContainer}>
                <Text style={styles.scheduleTitle}>Lab Schedule</Text>
                {schedules.map((schedule, index) => (
                  <View key={index} style={styles.scheduleItem}>
                    <View style={styles.scheduleHeader}>
                      <Text style={styles.labName}>{schedule.lab_name}</Text>
                      <Text style={styles.day}>{schedule.day_of_week}</Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Ionicons
                        name="time"
                        size={16}
                        color={Colors.light.icon}
                      />
                      <Text style={styles.time}>
                        {schedule.start_time} - {schedule.end_time}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Scan this QR code at the lab entrance
                </Text>
                <Text style={styles.warning}>
                  <Ionicons
                    name="warning"
                    size={16}
                    color={Colors.light.warning}
                  />{" "}
                  Do not share this code with anyone
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxHeight: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  closeButton: {
    padding: 8,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 20,
  },
  userInfo: {
    alignItems: "center",
    width: "100%",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  studentId: {
    fontSize: 16,
    color: Colors.light.icon,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  scheduleContainer: {
    width: "100%",
    marginBottom: 24,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  scheduleItem: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  labName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  day: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  time: {
    fontSize: 14,
    color: Colors.light.icon,
    marginLeft: 8,
  },
  footer: {
    width: "100%",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
  },
  warning: {
    fontSize: 12,
    color: Colors.light.warning,
    flexDirection: "row",
    alignItems: "center",
  },
});
