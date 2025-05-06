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

// Lab data structure after processing
interface Lab {
  id: string;
  name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  subject_code: string;
  section: string;
}

// Type for the lab data from Supabase
interface SupabaseLab {
  id: string;
  name: string;
  section: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subjects: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export default function Dashboard() {
  const { user, userProfile, refreshUserProfile, isLoading, getQRCode } =
    useAuth();
  const [refreshing, setRefreshing] = useState(false);
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

  useEffect(() => {
    // Debug log the selected day whenever it changes
    console.log(`Selected day changed to: ${selectedDay}`);
    if (labs.length > 0) {
      // Filter labs by day when selectedDay changes but only if we have labs loaded
      const todayLabs = labs.filter((lab) => lab.day_of_week === selectedDay);
      console.log(`Found ${todayLabs.length} labs for ${selectedDay}`);
    }
  }, [selectedDay]);

  const loadData = async () => {
    await refreshUserProfile();
    // Add debug call
    const debugResult = await debugDatabaseContent();
    console.log(debugResult);

    if (userProfile) {
      await fetchLabs();
    }
  };

  const fetchLabs = async () => {
    try {
      setIsLoadingLabs(true);
      if (!userProfile) return;

      // Get student course and section for filtering
      const studentCourse = userProfile.course || "";
      const studentSection = userProfile.section || "";

      console.log("Student course:", studentCourse);
      console.log("Student section:", studentSection);

      // First check if we can find matching subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from("subjects")
        .select("*");

      if (subjectsError) {
        console.error("Error fetching subjects:", subjectsError);
      } else if (studentCourse && subjects) {
        // Look for matching subjects based on name or code
        const matchingSubjects = subjects.filter(
          (subject) =>
            subject.name.toUpperCase().includes(studentCourse.toUpperCase()) ||
            (subject.code &&
              studentCourse
                .toUpperCase()
                .includes(subject.code.toUpperCase())) ||
            (subject.code &&
              subject.code.toUpperCase().includes(studentCourse.toUpperCase()))
        );

        if (matchingSubjects.length === 0) {
          console.warn(`No subjects found matching course: ${studentCourse}`);
        } else {
          console.log(
            `Found ${matchingSubjects.length} matching subjects:`,
            matchingSubjects.map((s) => `${s.code}: ${s.name}`)
          );
        }
      }

      // First get all labs with subject information using proper foreign key relationship
      const { data: allLabsData, error: allLabsError } = await supabase.from(
        "labs"
      ).select(`
          *,
          subjects:subject_id (
            id, name, code, description
          )
        `);

      if (allLabsError) {
        console.error("Error fetching labs:", allLabsError);
        throw allLabsError;
      }

      console.log("All labs fetched:", allLabsData?.length || 0);
      if (allLabsData && allLabsData.length > 0) {
        console.log(
          "Sample lab data:",
          JSON.stringify(allLabsData[0], null, 2)
        );
      } else {
        console.log("No labs found in database");
      }

      // Convert the labs to our format
      const formattedLabs: Lab[] = [];

      for (const lab of allLabsData || []) {
        // Skip invalid labs or labs without subject
        if (!lab || !lab.subjects) continue;

        // Get the subject data
        const subject = lab.subjects || {};

        formattedLabs.push({
          id: lab.id || "",
          name: lab.name || "Unknown Lab",
          section: lab.section || "",
          day_of_week: lab.day_of_week || "Monday",
          start_time: lab.start_time || "00:00:00",
          end_time: lab.end_time || "00:00:00",
          subject_name: subject.name || "Unknown Subject",
          subject_code: subject.code || "",
        });
      }

      console.log(`Formatted ${formattedLabs.length} labs`);

      // Filter labs based on course and section with better comparison logic
      let filteredLabs = formattedLabs;

      // Filter by course if specified - using multiple match strategies
      if (studentCourse) {
        const formattedCourse = studentCourse.trim().toUpperCase();
        // Create a temporary array to hold matches
        let courseMatches = [];

        // Strategy 1: Check if subject name contains the course name
        const nameMatches = formattedLabs.filter((lab) =>
          lab.subject_name.toUpperCase().includes(formattedCourse)
        );

        // Strategy 2: Check if course contains subject code
        const codeMatches = formattedLabs.filter(
          (lab) =>
            lab.subject_code &&
            (formattedCourse.includes(lab.subject_code.toUpperCase()) ||
              lab.subject_code.toUpperCase().includes(formattedCourse))
        );

        // Combine unique labs from both strategies
        courseMatches = [...new Set([...nameMatches, ...codeMatches])];

        console.log(
          `Found ${nameMatches.length} name matches and ${codeMatches.length} code matches`
        );

        if (courseMatches.length > 0) {
          filteredLabs = courseMatches;
          console.log(`After course filter: ${filteredLabs.length} labs`);
        } else {
          console.warn(`No labs match course: ${studentCourse}`);
        }
      }

      // Filter by section if specified
      if (studentSection && filteredLabs.length > 0) {
        // First try exact section match
        const exactSectionMatch = filteredLabs.filter(
          (lab) => lab.section === studentSection
        );

        // If we found exact matches, use them, otherwise keep all matches from the course filter
        if (exactSectionMatch.length > 0) {
          filteredLabs = exactSectionMatch;
          console.log(
            `Found ${exactSectionMatch.length} labs with exact section match: ${studentSection}`
          );
        } else {
          console.log(
            `No labs with exact section: ${studentSection}, showing all course labs`
          );
        }
        console.log(`After section filter: ${filteredLabs.length} labs`);
      }

      // If no labs are found after filtering by course and we have a course specified,
      // this means we couldn't find any subjects for this course
      if (
        filteredLabs.length === 0 &&
        studentCourse &&
        formattedLabs.length > 0
      ) {
        console.log(`No labs found for course: ${studentCourse}`);
        setModalConfig({
          title: "Lab Schedule Information",
          message: `We couldn't find any labs specifically for ${studentCourse}${
            studentSection ? `, Section ${studentSection}` : ""
          }. Showing all available labs instead.`,
          type: "info",
        });
        setModalVisible(true);

        // Show all labs instead
        filteredLabs = formattedLabs;
      }

      // Get today's labs
      const todayLabs = filteredLabs.filter(
        (lab) => lab.day_of_week === selectedDay
      );

      console.log(`Labs for ${selectedDay}: ${todayLabs.length}`);

      // Sort labs by start time
      todayLabs.sort((a, b) => a.start_time.localeCompare(b.start_time));

      setLabs(todayLabs);
    } catch (error) {
      console.error("Error fetching labs:", error);
      setLabs([]);
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

  const onDaySelected = (day: string) => {
    // Only fetch new data if the day changed
    if (selectedDay !== day) {
      setSelectedDay(day);
      // We need to reload labs from the database to ensure we have all
      // labs before filtering by day
      fetchLabs();
    }
  };

  // Add this function to verify database content directly
  const debugDatabaseContent = async () => {
    try {
      console.log("Debugging database content...");

      // Check subjects (courses)
      const { data: subjects, error: subjectsError } = await supabase
        .from("subjects")
        .select("*");

      if (subjectsError) {
        console.error("Error fetching subjects:", subjectsError);
      } else {
        console.log(`Found ${subjects?.length || 0} subjects:`, subjects);
      }

      // Check if any subjects match the student's course
      if (userProfile?.course && subjects && subjects.length > 0) {
        const studentCourse = userProfile.course; // Store in local variable to fix type issue
        const matchingSubjects = subjects.filter(
          (subject) =>
            subject.name.toUpperCase().includes(studentCourse.toUpperCase()) ||
            (subject.code &&
              studentCourse.toUpperCase().includes(subject.code.toUpperCase()))
        );

        console.log(
          `Found ${matchingSubjects.length} subjects matching course "${studentCourse}":`,
          matchingSubjects.map((s) => `${s.code}: ${s.name}`)
        );
      }

      // Check all labs without filtering
      const { data: allLabs, error: labsError } = await supabase
        .from("labs")
        .select("*, subjects:subject_id(*)");

      if (labsError) {
        console.error("Error fetching all labs:", labsError);
      } else {
        console.log(
          `Found ${allLabs?.length || 0} total labs in database:`,
          allLabs
        );
      }

      // Check student labs assignments
      if (user) {
        const { data: enrollments, error: enrollmentError } = await supabase
          .from("student_labs")
          .select("*")
          .eq("student_id", user.id);

        if (enrollmentError) {
          console.error(
            "Error fetching student lab enrollments:",
            enrollmentError
          );
        } else {
          console.log(
            `Found ${enrollments?.length || 0} student lab enrollments:`,
            enrollments
          );
        }
      }

      return `Found ${subjects?.length || 0} subjects, ${
        allLabs?.length || 0
      } labs, and checked student enrollments`;
    } catch (error) {
      console.error("Debug error:", error);
      return "Error debugging database";
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
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerDate}>{getCurrentDate()}</Text>
            <Text style={styles.headerTitle}>
              Hello, {userProfile?.full_name?.split(" ")[0] || "Student"}
            </Text>
            <View style={styles.courseInfoContainer}>
              <Ionicons name="school-outline" size={16} color="#fff" />
              <Text style={styles.courseText}>
                {userProfile?.course || "No Course"} • Section{" "}
                {userProfile?.section || "Unassigned"}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Lab Schedule */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Lab Schedule</Text>
            <View style={styles.courseFilterBadge}>
              <Text style={styles.courseFilterText}>
                {userProfile?.course
                  ? userProfile.section
                    ? `${userProfile.course}, Section ${userProfile.section}`
                    : `${userProfile.course}, All Sections`
                  : "All Courses"}
              </Text>
            </View>
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
                onPress={() => onDaySelected(day)}
              >
                <Text style={getDayTextStyle(day)}>{day.substring(0, 3)}</Text>
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
                  <Text style={styles.labTime}>
                    {formatTime(lab.start_time)}
                  </Text>
                  <View style={styles.timeLine} />
                  <Text style={styles.labEndTime}>
                    {formatTime(lab.end_time)}
                  </Text>
                </View>

                <View style={styles.labDetails}>
                  <View style={styles.labHeaderRow}>
                    <Text style={styles.labSubjectCode}>
                      {lab.subject_code}
                    </Text>
                    {lab.section && (
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>
                          Section {lab.section}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.labTitle}>{lab.name}</Text>

                  <Text style={styles.subjectName} numberOfLines={2}>
                    {lab.subject_name}
                  </Text>

                  <View style={styles.labInfoRow}>
                    <View style={styles.labDetail}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={Colors.light.textSecondary}
                      />
                      <Text style={styles.labDetailText}>
                        {formatTime(lab.start_time)} -{" "}
                        {formatTime(lab.end_time)}
                      </Text>
                    </View>

                    <View style={styles.labDetail}>
                      <Ionicons
                        name="people-outline"
                        size={16}
                        color={Colors.light.textSecondary}
                      />
                      <Text style={styles.labDetailText}>
                        {lab.section ? `Section ${lab.section}` : "No Section"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="flask-outline"
                size={48}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.emptyStateText}>
                No labs scheduled for {selectedDay}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Labs matching your course ({userProfile?.course || "None"}) and
                section ({userProfile?.section || "None"}) will appear here
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergencyAccess}
        >
          <Ionicons name="alert-circle-outline" size={20} color="#fff" />
          <Text style={styles.emergencyButtonText}>
            Request Emergency Lab Access
          </Text>
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
    backgroundColor: Colors.light.backgroundAlt,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 0,
    height: 140,
  },
  headerContent: {
    flex: 1,
    padding: 20,
    paddingTop: 16,
    justifyContent: "flex-end",
  },
  headerDate: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  courseInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  courseText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  sectionContainer: {
    marginTop: -30,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  courseFilterBadge: {
    backgroundColor: `${Colors.light.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  courseFilterText: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: "500",
  },
  daySelector: {
    marginBottom: 16,
  },
  daySelectorContent: {
    paddingVertical: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.light.backgroundAlt,
  },
  selectedDayButton: {
    backgroundColor: Colors.light.primary,
  },
  dayButtonText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500",
  },
  selectedDayButtonText: {
    color: "#fff",
  },
  labCard: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  labTimeContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  labTime: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  timeLine: {
    width: 2,
    height: 24,
    backgroundColor: `${Colors.light.primary}50`,
    marginVertical: 4,
  },
  labEndTime: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  labDetails: {
    flex: 1,
  },
  labHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  labSubjectCode: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: "600",
  },
  sectionBadge: {
    backgroundColor: `${Colors.light.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  sectionBadgeText: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  labTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  labInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 4,
  },
  labDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  labDetailText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 32,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.error,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  emergencyButtonText: {
    color: Colors.light.background,
    marginLeft: 8,
    fontWeight: "600",
  },
});
