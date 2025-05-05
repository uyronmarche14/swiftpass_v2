import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { CustomModal } from "../../components/ui/Modal";

export default function Profile() {
  const { user, logout, isLoading } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info" as "error" | "success" | "warning" | "info",
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      setModalConfig({
        title: "Error",
        message: "Failed to logout. Please try again.",
        type: "error",
      });
      setModalVisible(true);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri: "https://res.cloudinary.com/ddnxfpziq/image/upload/v1746457773/security-shield--crime-security-security-shield_kgo0w9.png",
            }}
            style={styles.profileImage}
          />
        </View>
        <Text style={styles.name}>{user?.full_name || "Student"}</Text>
        <Text style={styles.course}>{user?.course || "Course"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color={Colors.light.primary} />
            <Text style={styles.infoText}>{user?.email || "Email"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="school" size={20} color={Colors.light.primary} />
            <Text style={styles.infoText}>
              {user?.student_id || "Student ID"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lab Schedule</Text>
        <View style={styles.card}>
          {user?.lab_schedule ? (
            Object.entries(user.lab_schedule).map(([day, schedules]) => (
              <View key={day} style={styles.scheduleRow}>
                <Text style={styles.dayText}>{day}</Text>
                <View style={styles.scheduleDetailsContainer}>
                  {Array.isArray(schedules) ? (
                    schedules.map((schedule, index) => (
                      <View key={index} style={styles.scheduleDetails}>
                        <Text style={styles.scheduleText}>
                          {schedule.name}{" "}
                          {schedule.section && `(Section ${schedule.section})`}
                        </Text>
                        <Text style={styles.scheduleTimeText}>
                          {schedule.start_time} - {schedule.end_time}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.scheduleText}>{String(schedules)}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noScheduleText}>No lab schedule available</Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color={Colors.light.background} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundAlt,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: Colors.light.primaryDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: 60,
    height: 60,
    tintColor: Colors.light.background,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  course: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.primaryDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  infoText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
  },
  scheduleRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  dayText: {
    width: 80,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  scheduleDetailsContainer: {
    flex: 1,
  },
  scheduleDetails: {
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  scheduleTimeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  noScheduleText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    padding: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    margin: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.light.primaryDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
