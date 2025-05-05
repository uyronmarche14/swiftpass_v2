import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { CustomModal } from "../../components/ui/Modal";

const { width } = Dimensions.get("window");

interface Lab {
  id: string;
  name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  subject_code: string;
}

interface SupabaseLab {
  lab_id: string;
  labs: {
    id: string;
    name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    subjects?: {
      name: string;
      code: string;
    };
  };
}

export default function Dashboard() {
  const { user, userProfile, refreshUserProfile, isLoading, getQRCode } =
    useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedDay, setSelectedDay] = useState(getCurrentDayOfWeek());
  const [isLoadingLabs, setIsLoadingLabs] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info" as "error" | "success" | "warning" | "info",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await refreshUserProfile();
    loadQRCode();
    if (userProfile) {
      await fetchLabs();
    }
  };

  const loadQRCode = async () => {
    try {
      setQrLoading(true);
      const qrData = await getQRCode();
      setQrCode(qrData);
    } catch (error) {
      console.error("Error loading QR code:", error);
    } finally {
      setQrLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      setIsLoadingLabs(true);
      if (!userProfile) return;

      const { data: enrolledLabsData, error: enrolledLabsError } =
        await supabase
          .from("student_labs")
          .select(
            `
          lab_id,
          labs:lab_id (
            id,
            name,
            day_of_week,
            start_time,
            end_time,
            subjects:subject_id (
              name,
              code
            )
          )
        `
          )
          .eq("student_id", userProfile.id);

      if (enrolledLabsError) {
        console.error("Error fetching enrolled labs:", enrolledLabsError);
        return;
      }

      const formattedLabs: Lab[] = [];

      if (enrolledLabsData && enrolledLabsData.length > 0) {
        enrolledLabsData.forEach((item: any) => {
          if (item.labs && item.labs.day_of_week === selectedDay) {
            formattedLabs.push({
              id: item.labs.id,
              name: item.labs.name,
              day_of_week: item.labs.day_of_week,
              start_time: formatTime(item.labs.start_time),
              end_time: formatTime(item.labs.end_time),
              subject_name: item.labs.subjects?.name || "Unknown Subject",
              subject_code: item.labs.subjects?.code || "N/A",
            });
          }
        });
      }

      formattedLabs.sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
      });

      setLabs(formattedLabs);
    } catch (error) {
      console.error("Failed to fetch labs data:", error);
    } finally {
      setIsLoadingLabs(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  function getCurrentDayOfWeek() {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const today = new Date().getDay();
    return days[today];
  }

  function formatTime(timeString: string) {
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      const period = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
      return timeString;
    }
  }

  const getDayButtonStyle = (day: string) => {
    return [styles.dayButton, selectedDay === day && styles.selectedDayButton];
  };

  const getDayTextStyle = (day: string) => {
    return [
      styles.dayButtonText,
      selectedDay === day && styles.selectedDayButtonText,
    ];
  };

  const getCurrentDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const handleEmergencyAccess = () => {
    setModalConfig({
      title: "Emergency Access",
      message:
        "Your request has been sent to the administrator. Please wait for approval.",
      type: "info",
    });
    setModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.light.primary}
      />

      <LinearGradient
        colors={[Colors.light.primary, "#2a6fc5"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>
              {userProfile?.full_name || "Student"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons name="person-circle" size={36} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.dateText}>{getCurrentDate()}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Access Buttons */}
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity
            style={styles.quickAccessButton}
            onPress={() => router.push("/(tabs)/qrcode")}
          >
            <View style={styles.quickAccessIconContainer}>
              <Ionicons name="qr-code" size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.quickAccessText}>My QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessButton}
            onPress={() => router.push("/(tabs)/attendance")}
          >
            <View style={styles.quickAccessIconContainer}>
              <Ionicons
                name="calendar"
                size={24}
                color={Colors.light.primary}
              />
            </View>
            <Text style={styles.quickAccessText}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessButton}
            onPress={() => router.push("/(tabs)/access")}
          >
            <View style={styles.quickAccessIconContainer}>
              <Ionicons name="key" size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.quickAccessText}>Access</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAccessButton}>
            <View style={styles.quickAccessIconContainer}>
              <Ionicons
                name="settings"
                size={24}
                color={Colors.light.primary}
              />
            </View>
            <Text style={styles.quickAccessText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Lab Schedule */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lab Schedule</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.daySelector}
            contentContainerStyle={styles.daySelectorContent}
          >
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <TouchableOpacity
                key={day}
                style={getDayButtonStyle(day)}
                onPress={() => {
                  setSelectedDay(day);
                  fetchLabs();
                }}
              >
                <Text style={getDayTextStyle(day)}>{day}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isLoadingLabs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Loading labs...</Text>
            </View>
          ) : labs.length > 0 ? (
            labs.map((lab) => (
              <View key={lab.id} style={styles.labCard}>
                <View style={styles.labTimeContainer}>
                  <Text style={styles.labTime}>{lab.start_time}</Text>
                  <View style={styles.timeLine} />
                  <Text style={styles.labEndTime}>{lab.end_time}</Text>
                </View>

                <View style={styles.labDetails}>
                  <Text style={styles.labSubjectCode}>{lab.subject_code}</Text>
                  <Text style={styles.labTitle}>{lab.subject_name}</Text>
                  <View style={styles.labLocationContainer}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={Colors.light.icon}
                    />
                    <Text style={styles.labLocation}>{lab.name}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="flask-outline"
                size={48}
                color={Colors.light.icon}
              />
              <Text style={styles.emptyStateText}>
                No labs scheduled for {selectedDay}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Your lab schedule will appear here once it's added by an
                administrator
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergencyAccess}
        >
          <Ionicons name="warning" size={20} color={Colors.light.background} />
          <Text style={styles.emergencyButtonText}>Emergency Access</Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  dateText: {
    marginTop: 8,
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  quickAccessContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickAccessButton: {
    width: (width - 50) / 4,
    alignItems: "center",
  },
  quickAccessIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  daySelector: {
    marginBottom: 16,
  },
  daySelectorContent: {
    paddingRight: 20,
    paddingLeft: 4,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  selectedDayButton: {
    backgroundColor: Colors.light.primary,
  },
  dayButtonText: {
    fontSize: 14,
    color: "#666",
  },
  selectedDayButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  labCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  labTimeContainer: {
    alignItems: "center",
    width: 80,
  },
  labTime: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  timeLine: {
    width: 2,
    backgroundColor: "#eee",
    height: 30,
    marginVertical: 8,
  },
  labEndTime: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  labDetails: {
    flex: 1,
    marginLeft: 16,
  },
  labSubjectCode: {
    fontSize: 13,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  labTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  labLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  labLocation: {
    fontSize: 14,
    color: Colors.light.icon,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: "center",
    maxWidth: "80%",
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  emergencyButtonText: {
    color: Colors.light.background,
    marginLeft: 8,
    fontWeight: "600",
  },
});
