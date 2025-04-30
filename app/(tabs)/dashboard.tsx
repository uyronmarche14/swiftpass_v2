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

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const { user, userProfile, refreshUserProfile, isLoading, getQRCode } =
    useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await refreshUserProfile();
    loadQRCode();
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Get current date and time
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

  // Mock upcoming classes
  const upcomingClasses = [
    {
      id: "1",
      time: "09:00 AM",
      name: "Computer Science 101",
      location: "Computer Lab",
      duration: "2 hours",
    },
    {
      id: "2",
      time: "02:00 PM",
      name: "Physics 201",
      location: "Physics Lab",
      duration: "1.5 hours",
    },
  ];

  // Mock notifications
  const notifications = [
    {
      id: "1",
      message: "Your attendance rate is 95% this month",
      time: "2 hours ago",
      type: "success",
    },
    {
      id: "2",
      message: "Physics 201 class rescheduled to 2:00 PM",
      time: "1 day ago",
      type: "info",
    },
    {
      id: "3",
      message: "You have missed Chemistry 101 class",
      time: "2 days ago",
      type: "warning",
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
      case "warning":
        return <Ionicons name="alert-circle" size={24} color="#FFC107" />;
      case "info":
        return <Ionicons name="information-circle" size={24} color="#2196F3" />;
      default:
        return <Ionicons name="notifications" size={24} color="#757575" />;
    }
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

        {/* Today's Schedule */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingClasses.length > 0 ? (
            upcomingClasses.map((classItem) => (
              <View key={classItem.id} style={styles.scheduleCard}>
                <View style={styles.scheduleTimeContainer}>
                  <Text style={styles.scheduleTime}>{classItem.time}</Text>
                  <Text style={styles.scheduleDuration}>
                    {classItem.duration}
                  </Text>
                </View>

                <View style={styles.scheduleDetails}>
                  <Text style={styles.scheduleTitle}>{classItem.name}</Text>
                  <View style={styles.scheduleLocationContainer}>
                    <Ionicons name="location" size={16} color="#757575" />
                    <Text style={styles.scheduleLocation}>
                      {classItem.location}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.scheduleAction}>
                  <Ionicons name="chevron-forward" size={20} color="#bbb" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyScheduleContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyScheduleText}>
                No classes scheduled for today
              </Text>
            </View>
          )}
        </View>

        {/* Notifications */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationIconContainer}>
                {getNotificationIcon(notification.type)}
              </View>

              <View style={styles.notificationContent}>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>

              <TouchableOpacity style={styles.notificationAction}>
                <Ionicons name="ellipsis-vertical" size={20} color="#bbb" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statsNumber}>95%</Text>
            <Text style={styles.statsLabel}>Attendance</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <Ionicons name="time" size={24} color="#FFC107" />
            </View>
            <Text style={styles.statsNumber}>3</Text>
            <Text style={styles.statsLabel}>Late Arrivals</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <Ionicons name="calendar" size={24} color="#2196F3" />
            </View>
            <Text style={styles.statsNumber}>24</Text>
            <Text style={styles.statsLabel}>Classes</Text>
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
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleTimeContainer: {
    width: 80,
    alignItems: "center",
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  scheduleDuration: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  scheduleDetails: {
    flex: 1,
    paddingHorizontal: 12,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  scheduleLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleLocation: {
    fontSize: 13,
    color: "#757575",
    marginLeft: 4,
  },
  scheduleAction: {
    padding: 4,
  },
  emptyScheduleContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  emptyScheduleText: {
    marginTop: 16,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationIconContainer: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#757575",
  },
  notificationAction: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsIconContainer: {
    marginBottom: 8,
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  statsLabel: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
  },
});
