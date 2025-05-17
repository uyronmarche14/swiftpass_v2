import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { router } from "expo-router";

export default function AdminDashboard() {
  const { adminProfile, logout, isLoading, getAllStudents, getAllLabs } =
    useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    studentsCount: 0,
    labsCount: 0,
    coursesCount: 0,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const studentsData = await getAllStudents();
      const labsData = await getAllLabs();

      setStudents(studentsData);
      setLabs(labsData);

      // Calculate stats
      const uniqueCourses = new Set(
        studentsData.map((student) => student.course).filter(Boolean)
      );

      setStats({
        studentsCount: studentsData.length,
        labsCount: labsData.length,
        coursesCount: uniqueCourses.size,
      });
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading || isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Welcome back, {adminProfile?.full_name || "Admin"}
          </Text>
          <Text style={styles.role}>
            {adminProfile?.role || "Administrator"}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color={Colors.light.primary} />
          <Text style={styles.statNumber}>{stats.studentsCount}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color={Colors.light.primary} />
          <Text style={styles.statNumber}>{stats.labsCount}</Text>
          <Text style={styles.statLabel}>Labs</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="school" size={24} color={Colors.light.primary} />
          <Text style={styles.statNumber}>{stats.coursesCount}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/admin/students" as any)}
        >
          <Ionicons name="people" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Manage Students</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/admin/labs" as any)}
        >
          <Ionicons name="calendar" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Manage Labs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/admin/qrcode" as any)}
        >
          <Ionicons name="qr-code" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Admin QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/admin/sections" as any)}
        >
          <Ionicons name="layers-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Manage Sections</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/admin/courses" as any)}
        >
          <Ionicons name="school" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Manage Courses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/admin/attendance" as any)}
        >
          <Ionicons name="calendar-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Attendance Records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/admin/schedules" as any)}
        >
          <Ionicons name="time" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Manage Schedules</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#28a745" }]}
          onPress={() => router.push("/admin/scanner" as any)}
        >
          <Ionicons name="qr-code" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>QR Scanner</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Students</Text>
      <View style={styles.recentContainer}>
        {students.slice(0, 5).map((student, index) => (
          <View key={student.id} style={styles.recentItem}>
            <View style={styles.studentAvatar}>
              <Text style={styles.avatarText}>
                {student.full_name?.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.full_name}</Text>
              <Text style={styles.studentDetails}>
                {student.student_id} • {student.course || "No course"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() =>
                router.push({
                  pathname: "/admin/students" as any,
                  params: { id: student.id },
                })
              }
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.light.primary}
              />
            </TouchableOpacity>
          </View>
        ))}

        {students.length === 0 && (
          <Text style={styles.emptyText}>No students registered yet</Text>
        )}

        {students.length > 5 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push("/admin/students" as any)}
          >
            <Text style={styles.viewAllText}>View all students</Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={Colors.light.primary}
            />
          </TouchableOpacity>
        )}
      </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  role: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: Colors.light.primary,
    padding: 10,
    borderRadius: 50,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.light.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  actionsContainer: {
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  recentContainer: {
    padding: 16,
    backgroundColor: Colors.light.background,
    margin: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: Colors.light.background,
    fontWeight: "bold",
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  studentDetails: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  viewButton: {
    padding: 8,
  },
  viewAllButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: "500",
    marginRight: 8,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: Colors.light.textSecondary,
    padding: 20,
  },
});
