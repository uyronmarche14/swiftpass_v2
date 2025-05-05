import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";

interface AttendanceHistoryItem {
  id: string;
  time_in: string;
  time_out: string | null;
  lab_name?: string;
  subject_name?: string;
}

interface ScheduleItem {
  id: string;
  name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  location: string;
}

export default function ProfileScreen() {
  const { userProfile, isLoading, refreshUserProfile, logout } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<
    AttendanceHistoryItem[]
  >([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getCurrentDayOfWeek());

  useEffect(() => {
    if (userProfile) {
      fetchAttendanceHistory();
      fetchSchedule();
    }
  }, [userProfile, selectedDay]);

  function getCurrentDayOfWeek() {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = new Date().getDay();
    return days[today];
  }

  const fetchSchedule = async () => {
    try {
      setIsLoadingSchedule(true);
      if (!userProfile) return;

      // Fetch schedule for the user
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
                name
              )
            )
          `
          )
          .eq("student_id", userProfile.id);

      if (enrolledLabsError) {
        console.error("Error fetching schedule:", enrolledLabsError);
        return;
      }

      // Filter and transform data
      const formattedSchedule: ScheduleItem[] = [];

      if (enrolledLabsData && enrolledLabsData.length > 0) {
        enrolledLabsData.forEach((item: any) => {
          if (item.labs && item.labs.day_of_week === selectedDay) {
            formattedSchedule.push({
              id: item.labs.id,
              name: item.labs.name,
              day_of_week: item.labs.day_of_week,
              start_time: formatTime(item.labs.start_time),
              end_time: formatTime(item.labs.end_time),
              subject_name: item.labs.subjects?.name || "Unknown Subject",
              location: item.labs.name,
            });
          }
        });
      }

      // Sort by start time
      formattedSchedule.sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
      });

      setScheduleItems(formattedSchedule);
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  function formatTime(timeString: string) {
    try {
      // Input is like "14:30:00"
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);

      // Convert to 12-hour format
      const period = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12; // Convert 0 to 12

      return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
      return timeString;
    }
  }

  const fetchAttendanceHistory = async () => {
    try {
      setIsLoadingHistory(true);
      if (!userProfile) return;

      // Fetch attendance history for the user
      const { data, error } = await supabase
        .from("attendance")
        .select(
          `
          id, 
          time_in, 
          time_out, 
          lab_id, 
          labs:lab_id (
            name, 
            subject_id,
            subjects:subject_id (
              name
            )
          )
        `
        )
        .eq("student_id", userProfile.id)
        .order("time_in", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching attendance history:", error);
        return;
      }

      // Transform the data for display
      const formattedData = data.map((item: any) => ({
        id: item.id,
        time_in: item.time_in,
        time_out: item.time_out,
        lab_name: item.labs?.name || "Unknown Lab",
        subject_name: item.labs?.subjects?.name || "Unknown Subject",
      }));

      setAttendanceHistory(formattedData);
    } catch (error) {
      console.error("Failed to fetch attendance history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserProfile();
    await fetchAttendanceHistory();
    await fetchSchedule();
    setIsRefreshing(false);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: logout,
        style: "destructive",
      },
    ]);
  };

  const getDayButtonStyle = (day: string) => {
    return [styles.dayButton, selectedDay === day && styles.selectedDayButton];
  };

  const getDayTextStyle = (day: string) => {
    return [
      styles.dayButtonText,
      selectedDay === day && styles.selectedDayButtonText,
    ];
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <LinearGradient
        colors={[Colors.light.tint, Colors.light.background]}
        style={styles.header}
      >
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={50} color="#fff" />
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.userName}>
            {userProfile?.full_name || "User"}
          </Text>
          <Text style={styles.userDetails}>{userProfile?.email}</Text>
          <Text style={styles.userDetails}>
            Student ID: {userProfile?.student_id || "Not available"}
          </Text>
          <Text style={styles.userDetails}>
            Course: {userProfile?.course || "Not specified"}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.content}>
        {/* Schedule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Schedule</Text>

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
                onPress={() => setSelectedDay(day)}
              >
                <Text style={getDayTextStyle(day)}>{day}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isLoadingSchedule ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : scheduleItems.length > 0 ? (
            <View style={styles.scheduleContainer}>
              {scheduleItems.map((item) => (
                <View key={item.id} style={styles.scheduleItem}>
                  <View style={styles.scheduleTime}>
                    <Text style={styles.scheduleTimeText}>
                      {item.start_time}
                    </Text>
                    <View style={styles.scheduleDivider} />
                    <Text style={styles.scheduleEndTimeText}>
                      {item.end_time}
                    </Text>
                  </View>

                  <View style={styles.scheduleDetails}>
                    <Text style={styles.scheduleSubject}>
                      {item.subject_name}
                    </Text>
                    <View style={styles.scheduleLocationRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={Colors.light.icon}
                      />
                      <Text style={styles.scheduleLocation}>
                        {item.location}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={Colors.light.icon}
              />
              <Text style={styles.emptyStateText}>
                No classes scheduled for {selectedDay}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance History</Text>

          {isLoadingHistory ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : attendanceHistory.length > 0 ? (
            <View style={styles.historyContainer}>
              {attendanceHistory.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>{item.lab_name}</Text>
                    <Text style={styles.historySubject}>
                      {item.subject_name}
                    </Text>
                  </View>

                  <View style={styles.timeContainer}>
                    <View style={styles.timeItem}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={Colors.light.tint}
                      />
                      <Text style={styles.timeLabel}>In: </Text>
                      <Text style={styles.timeValue}>
                        {formatDateTime(item.time_in)}
                      </Text>
                    </View>

                    {item.time_out && (
                      <View style={styles.timeItem}>
                        <Ionicons
                          name="exit-outline"
                          size={16}
                          color={Colors.light.tint}
                        />
                        <Text style={styles.timeLabel}>Out: </Text>
                        <Text style={styles.timeValue}>
                          {formatDateTime(item.time_out)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={Colors.light.icon}
              />
              <Text style={styles.emptyStateText}>
                No attendance records found
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.light.tint}50`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  profileInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 4,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
  },
  logoutText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "600",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
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
  scheduleContainer: {
    gap: 12,
  },
  scheduleItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
  },
  scheduleTime: {
    width: 80,
    alignItems: "center",
  },
  scheduleTimeText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  scheduleDivider: {
    height: 20,
    width: 1,
    backgroundColor: "#eee",
    marginVertical: 6,
  },
  scheduleEndTimeText: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  scheduleDetails: {
    flex: 1,
    marginLeft: 16,
  },
  scheduleSubject: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 6,
  },
  scheduleLocationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleLocation: {
    fontSize: 14,
    color: Colors.light.icon,
    marginLeft: 4,
  },
  historyContainer: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyHeader: {
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  historySubject: {
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 2,
  },
  timeContainer: {
    marginTop: 8,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
    marginLeft: 4,
  },
  timeValue: {
    fontSize: 14,
    color: Colors.light.text,
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.icon,
    marginTop: 12,
    marginBottom: 20,
  },
});
