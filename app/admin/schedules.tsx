import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

export default function SchedulesScreen() {
  const { isAdmin, isLoading, getAllStudents, getAllLabs } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
  const [isLabModalVisible, setIsLabModalVisible] = useState(false);

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

      // Load existing schedules (student-lab enrollments)
      await fetchSchedules();
    } catch (error) {
      console.error("Error loading schedules data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from("student_labs")
        .select(
          `
          id, created_at,
          students (id, full_name, student_id, course),
          labs (id, name, section, day_of_week, start_time, end_time, subjects(name))
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSchedules(data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const assignLabToStudent = async () => {
    if (!selectedStudent || !selectedLab) {
      Alert.alert("Error", "Please select both a student and a lab");
      return;
    }

    try {
      setIsLoadingData(true);

      const { error } = await supabase.from("student_labs").insert([
        {
          student_id: selectedStudent.id,
          lab_id: selectedLab.id,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      Alert.alert(
        "Success",
        `${selectedStudent.full_name} has been assigned to ${selectedLab.name} lab`
      );

      setSelectedStudent(null);
      setSelectedLab(null);

      // Reload schedules
      await fetchSchedules();
    } catch (error: any) {
      console.error("Error assigning lab:", error);

      if (error.code === "23505") {
        Alert.alert("Error", "Student is already enrolled in this lab");
      } else {
        Alert.alert("Error", "Failed to assign lab to student");
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const removeSchedule = async (scheduleId: string) => {
    try {
      Alert.alert(
        "Remove Schedule",
        "Are you sure you want to remove this lab schedule?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              setIsLoadingData(true);

              const { error } = await supabase
                .from("student_labs")
                .delete()
                .eq("id", scheduleId);

              if (error) throw error;

              // Reload schedules
              await fetchSchedules();
              setIsLoadingData(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error removing schedule:", error);
      Alert.alert("Error", "Failed to remove lab schedule");
      setIsLoadingData(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading schedules...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lab Schedules</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setSelectedStudent(null);
            setSelectedLab(null);
            setIsStudentModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Assign Lab</Text>
        </TouchableOpacity>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="calendar-outline"
            size={64}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.emptyText}>No lab schedules assigned yet</Text>
          <Text style={styles.emptySubText}>
            Assign students to labs to create schedules
          </Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarText}>
                    {item.students.full_name?.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.studentName}>
                    {item.students.full_name}
                  </Text>
                  <Text style={styles.studentId}>
                    {item.students.student_id} •{" "}
                    {item.students.course || "No course"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeSchedule(item.id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={Colors.light.error}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.labDetails}>
                <View style={styles.labInfoRow}>
                  <Ionicons
                    name="flask-outline"
                    size={18}
                    color={Colors.light.primary}
                  />
                  <Text style={styles.labName}>
                    {item.labs.name} - {item.labs.subjects?.name}
                    {item.labs.section && ` (Section ${item.labs.section})`}
                  </Text>
                </View>
                <View style={styles.labInfoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={Colors.light.primary}
                  />
                  <Text style={styles.labDay}>{item.labs.day_of_week}</Text>
                </View>
                <View style={styles.labInfoRow}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={Colors.light.primary}
                  />
                  <Text style={styles.labTime}>
                    {item.labs.start_time} - {item.labs.end_time}
                  </Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.schedulesList}
          showsVerticalScrollIndicator={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}

      {/* Student Selection Modal */}
      <Modal
        visible={isStudentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsStudentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Student</Text>
              <TouchableOpacity onPress={() => setIsStudentModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={students}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectionItem,
                    selectedStudent?.id === item.id && styles.selectedItem,
                  ]}
                  onPress={() => {
                    setSelectedStudent(item);
                    setIsStudentModalVisible(false);
                    setIsLabModalVisible(true);
                  }}
                >
                  <View style={styles.studentSelectAvatar}>
                    <Text style={styles.avatarText}>
                      {item.full_name?.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.selectInfo}>
                    <Text style={styles.selectName}>{item.full_name}</Text>
                    <Text style={styles.selectDetail}>
                      {item.student_id} • {item.course || "No course"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.light.textSecondary}
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.selectionList}
            />
          </View>
        </View>
      </Modal>

      {/* Lab Selection Modal */}
      <Modal
        visible={isLabModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsLabModalVisible(false);
          setIsStudentModalVisible(true);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Lab</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsLabModalVisible(false);
                  setIsStudentModalVisible(true);
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={Colors.light.text}
                />
              </TouchableOpacity>
            </View>

            {selectedStudent && (
              <View style={styles.selectedStudentInfo}>
                <Text style={styles.selectedLabel}>Selected Student:</Text>
                <Text style={styles.selectedStudentName}>
                  {selectedStudent.full_name}
                </Text>
              </View>
            )}

            <FlatList
              data={labs.filter((lab) => {
                // Filter labs based on student's course
                if (selectedStudent?.course && lab.subjects) {
                  // If student has a course and the subject matches that course, show it
                  // This assumes that course name matches subject name, which is a simplification
                  // You could add a course_id to the subjects table for more precise matching
                  return lab.subjects.name.includes(selectedStudent.course);
                }
                // If student has no course or subject doesn't match, show all labs
                return true;
              })}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectionItem,
                    selectedLab?.id === item.id && styles.selectedItem,
                  ]}
                  onPress={() => {
                    setSelectedLab(item);
                    setIsLabModalVisible(false);
                    assignLabToStudent();
                  }}
                >
                  <View style={styles.labSelectIcon}>
                    <Ionicons
                      name="flask"
                      size={20}
                      color={Colors.light.background}
                    />
                  </View>
                  <View style={styles.selectInfo}>
                    <Text style={styles.selectName}>
                      {item.name} ({item.subjects?.name})
                      {item.section && ` • Section ${item.section}`}
                    </Text>
                    <Text style={styles.selectDetail}>
                      {item.day_of_week}, {item.start_time} - {item.end_time}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.light.textSecondary}
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.selectionList}
            />
          </View>
        </View>
      </Modal>
    </View>
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
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 32,
  },
  schedulesList: {
    padding: 16,
    paddingBottom: 100,
  },
  scheduleCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    alignItems: "center",
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
  scheduleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  studentId: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  labDetails: {
    padding: 16,
  },
  labInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.light.text,
    marginLeft: 8,
  },
  labDay: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  labTime: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  selectionList: {
    paddingVertical: 8,
  },
  selectionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  selectedItem: {
    backgroundColor: `${Colors.light.primary}10`,
  },
  studentSelectAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  labSelectIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  selectInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectName: {
    fontSize: 16,
    color: Colors.light.text,
  },
  selectDetail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  selectedStudentInfo: {
    padding: 16,
    backgroundColor: Colors.light.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  selectedLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  selectedStudentName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginTop: 4,
  },
});
