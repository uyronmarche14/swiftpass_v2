import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
  lab: string;
  course: string;
  status: "Present" | "Late" | "Absent";
}

interface CourseAttendance {
  courseId: string;
  courseName: string;
  attendanceRate: number;
  totalSessions: number;
  completedSessions: number;
}

export default function AttendanceScreen() {
  const { userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Mock data for attendance records
  const mockAttendanceData: AttendanceRecord[] = [
    {
      id: "1",
      date: "2024-05-02",
      timeIn: "09:00 AM",
      timeOut: "11:30 AM",
      lab: "Computer Lab",
      course: "Computer Science 101",
      status: "Present",
    },
    {
      id: "2",
      date: "2024-05-01",
      timeIn: "10:15 AM",
      timeOut: "12:45 PM",
      lab: "Physics Lab",
      course: "Physics 201",
      status: "Late",
    },
    {
      id: "3",
      date: "2024-04-30",
      timeIn: "08:45 AM",
      timeOut: "11:15 AM",
      lab: "Computer Lab",
      course: "Computer Science 101",
      status: "Present",
    },
    {
      id: "4",
      date: "2024-04-29",
      timeIn: "14:00 PM",
      timeOut: null,
      lab: "Chemistry Lab",
      course: "Chemistry 101",
      status: "Absent",
    },
    {
      id: "5",
      date: "2024-04-28",
      timeIn: "09:30 AM",
      timeOut: "12:00 PM",
      lab: "Physics Lab",
      course: "Physics 201",
      status: "Present",
    },
  ];

  // Mock course data with attendance statistics
  const courseAttendanceData: CourseAttendance[] = [
    {
      courseId: "CS101",
      courseName: "Computer Science 101",
      attendanceRate: 92,
      totalSessions: 8,
      completedSessions: 8,
    },
    {
      courseId: "PHY201",
      courseName: "Physics 201",
      attendanceRate: 85,
      totalSessions: 6,
      completedSessions: 5,
    },
    {
      courseId: "CHEM101",
      courseName: "Chemistry 101",
      attendanceRate: 60,
      totalSessions: 4,
      completedSessions: 3,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "#4CAF50";
      case "Late":
        return "#FFC107";
      case "Absent":
        return "#F44336";
      default:
        return Colors.light.text;
    }
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return "#4CAF50";
    if (rate >= 75) return "#FFC107";
    return "#F44336";
  };

  // Filter attendance records by date or course
  const getFilteredRecords = () => {
    if (selectedFilter === "all") return mockAttendanceData;
    return mockAttendanceData.filter((record) =>
      record.course.includes(selectedFilter)
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate fetching data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Calculate overall attendance rate across all courses
  const overallAttendanceRate = () => {
    const totalAttended = courseAttendanceData.reduce(
      (sum, course) =>
        sum + (course.attendanceRate * course.completedSessions) / 100,
      0
    );
    const totalSessions = courseAttendanceData.reduce(
      (sum, course) => sum + course.completedSessions,
      0
    );
    return Math.round((totalAttended / totalSessions) * 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onPress={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Attendance</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color={Colors.light.tint}
            />
          </TouchableOpacity>
        </View>

        {/* Overall Attendance Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsCardHeader}>
            <View>
              <Text style={styles.statsCardTitle}>Overall Attendance</Text>
              <Text style={styles.statsCardSubtitle}>Across all courses</Text>
            </View>
            <View
              style={[
                styles.attendanceRateContainer,
                {
                  backgroundColor: `${getAttendanceRateColor(
                    overallAttendanceRate()
                  )}20`,
                },
              ]}
            >
              <Text
                style={[
                  styles.attendanceRateText,
                  { color: getAttendanceRateColor(overallAttendanceRate()) },
                ]}
              >
                {overallAttendanceRate()}%
              </Text>
            </View>
          </View>

          <View style={styles.statsCardDetails}>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>
                {courseAttendanceData.reduce(
                  (sum, course) => sum + course.totalSessions,
                  0
                )}
              </Text>
              <Text style={styles.statsLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>
                {courseAttendanceData.reduce(
                  (sum, course) => sum + course.completedSessions,
                  0
                )}
              </Text>
              <Text style={styles.statsLabel}>Attended</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>
                {
                  mockAttendanceData.filter(
                    (record) => record.status === "Late"
                  ).length
                }
              </Text>
              <Text style={styles.statsLabel}>Late</Text>
            </View>
          </View>
        </View>

        {/* Course Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === "all" && styles.activeFilterChip,
            ]}
            onPress={() => setSelectedFilter("all")}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === "all" && styles.activeFilterChipText,
              ]}
            >
              All Courses
            </Text>
          </TouchableOpacity>

          {courseAttendanceData.map((course) => (
            <TouchableOpacity
              key={course.courseId}
              style={[
                styles.filterChip,
                selectedFilter === course.courseName && styles.activeFilterChip,
              ]}
              onPress={() => setSelectedFilter(course.courseName)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === course.courseName &&
                    styles.activeFilterChipText,
                ]}
              >
                {course.courseName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Course Attendance Cards */}
        <Text style={styles.sectionTitle}>Course Attendance</Text>

        {courseAttendanceData.map((course) => (
          <View key={course.courseId} style={styles.courseCard}>
            <View style={styles.courseCardHeader}>
              <Text style={styles.courseNameText}>{course.courseName}</Text>
              <View
                style={[
                  styles.courseAttendanceRate,
                  {
                    backgroundColor: `${getAttendanceRateColor(
                      course.attendanceRate
                    )}20`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.courseAttendanceRateText,
                    { color: getAttendanceRateColor(course.attendanceRate) },
                  ]}
                >
                  {course.attendanceRate}%
                </Text>
              </View>
            </View>

            <View style={styles.courseProgressContainer}>
              <View style={styles.courseProgressBar}>
                <View
                  style={[
                    styles.courseProgressFill,
                    {
                      width: `${course.attendanceRate}%`,
                      backgroundColor: getAttendanceRateColor(
                        course.attendanceRate
                      ),
                    },
                  ]}
                />
              </View>
              <Text style={styles.courseProgressText}>
                {course.completedSessions} of {course.totalSessions} sessions
              </Text>
            </View>
          </View>
        ))}

        {/* Attendance Records Table */}
        <Text style={styles.sectionTitle}>Recent Check-ins</Text>

        <View style={styles.tableContainer}>
          {getFilteredRecords().map((record) => (
            <View key={record.id} style={styles.tableRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateText}>{formatDate(record.date)}</Text>
                <Text style={styles.timeText}>{record.timeIn}</Text>
              </View>

              <View style={styles.courseColumn}>
                <Text style={styles.courseText}>{record.course}</Text>
                <Text style={styles.labText}>{record.lab}</Text>
              </View>

              <View
                style={[
                  styles.statusContainer,
                  { backgroundColor: `${getStatusColor(record.status)}20` },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(record.status) },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(record.status) },
                  ]}
                >
                  {record.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statsCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  statsCardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  attendanceRateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  attendanceRateText: {
    fontSize: 18,
    fontWeight: "700",
  },
  statsCardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsItem: {
    alignItems: "center",
    width: "30%",
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: "#666",
  },
  filterChipsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterChip: {
    backgroundColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterChipText: {
    color: "#fff",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  courseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  courseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  courseNameText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    flex: 1,
  },
  courseAttendanceRate: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  courseAttendanceRateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  courseProgressContainer: {
    marginTop: 4,
  },
  courseProgressBar: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  courseProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  courseProgressText: {
    fontSize: 12,
    color: "#666",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dateColumn: {
    width: 90,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  courseColumn: {
    flex: 1,
    paddingHorizontal: 10,
  },
  courseText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
  },
  labText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
