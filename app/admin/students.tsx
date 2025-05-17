import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { supabase } from "../../lib/supabase";
import DropDownPicker from "react-native-dropdown-picker";
import { router, useLocalSearchParams } from "expo-router";
import { SectionService } from "../../lib/services/sectionService";

// Course options
const courseOptions = [
  { label: "Bachelor of Science in Information Technology", value: "BSIT" },
  { label: "Bachelor of Science in Computer Science", value: "BSCS" },
];

// Section options will be loaded from the database

export default function StudentsScreen() {
  const { isAdmin, isLoading, getAllStudents, getAllLabs } = useAuth();
  const params = useLocalSearchParams();
  const selectedStudentId = params.id as string;

  const [students, setStudents] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
  const [isLabAssignModalVisible, setIsLabAssignModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Lab assignment state
  const [openLabPicker, setOpenLabPicker] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [studentLabs, setStudentLabs] = useState<any[]>([]);
  
  // Sections state
  const [sectionOptions, setSectionOptions] = useState<{ label: string; value: string }[]>([]);

  // Dropdown state for filters
  const [openCoursePicker, setOpenCoursePicker] = useState(false);
  const [openSectionPicker, setOpenSectionPicker] = useState(false);
  const [filterCourse, setFilterCourse] = useState<string | null>(null);
  const [filterSection, setFilterSection] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // If a student ID was passed in the URL params, open that student's details
    if (selectedStudentId && students.length > 0) {
      const student = students.find((s) => s.id === selectedStudentId);
      if (student) {
        handleViewStudent(student);
      }
    }
  }, [selectedStudentId, students]);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, filterCourse, filterSection]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const studentsData = await getAllStudents();
      setStudents(studentsData);
      setFilteredStudents(studentsData);

      const labsData = await getAllLabs();
      setLabs(labsData);
      
      // Load sections from the database
      try {
        const sectionsResult = await SectionService.getAllSections();
        
        if (sectionsResult.success && sectionsResult.data) {
          const sectionsData = sectionsResult.data as any[];
          const formattedSections = sectionsData.map(section => ({
            label: section.name,
            value: section.code
          }));
          setSectionOptions(formattedSections);
        } else {
          // Fallback to hardcoded sections if there's an error
          setSectionOptions([
            { label: "Section A2021", value: "A2021" },
            { label: "Section B2021", value: "B2021" },
            { label: "Section C2021", value: "C2021" },
          ]);
        }
      } catch (sectionsError) {
        console.error("Error loading sections:", sectionsError);
        // Fallback to hardcoded sections if there's an error
        setSectionOptions([
          { label: "Section A2021", value: "A2021" },
          { label: "Section B2021", value: "B2021" },
          { label: "Section C2021", value: "C2021" },
        ]);
      }
    } catch (error) {
      console.error("Error loading students data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.full_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          student.student_id
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply course filter
    if (filterCourse) {
      filtered = filtered.filter((student) => student.course === filterCourse);
    }

    // Apply section filter
    if (filterSection) {
      filtered = filtered.filter(
        (student) => student.section === filterSection
      );
    }

    setFilteredStudents(filtered);
  };

  const handleViewStudent = async (student: any) => {
    setSelectedStudent(student);
    setIsStudentModalVisible(true);

    // Load student's labs
    try {
      const { data: enrollments, error } = await supabase
        .from("student_labs")
        .select(
          `
          lab_id,
          labs!student_labs_lab_id_fkey (
            id, name, section, day_of_week, start_time, end_time,
            subjects:subject_id (name, code)
          )
        `
        )
        .eq("student_id", student.id);

      if (error) throw error;
      setStudentLabs(enrollments || []);
    } catch (error) {
      console.error("Error loading student labs:", error);
    }
  };

  const handleLabAssignment = (student: any) => {
    setSelectedStudent(student);
    setSelectedLabId(null);
    setIsLabAssignModalVisible(true);
  };

  const assignLabToStudent = async () => {
    if (!selectedStudent || !selectedLabId) {
      Alert.alert("Error", "Please select a lab");
      return;
    }

    try {
      setIsLoadingData(true);

      // Check if enrollment already exists
      const { data: existingEnrollment, error: checkError } = await supabase
        .from("student_labs")
        .select("id")
        .eq("student_id", selectedStudent.id)
        .eq("lab_id", selectedLabId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingEnrollment) {
        Alert.alert("Info", "Student is already enrolled in this lab");
        setIsLoadingData(false);
        return;
      }

      // Create enrollment
      const { error } = await supabase.from("student_labs").insert([
        {
          student_id: selectedStudent.id,
          lab_id: selectedLabId,
        },
      ]);

      if (error) throw error;

      Alert.alert("Success", "Student enrolled in lab successfully");

      // Refresh student labs
      const { data: enrollments } = await supabase
        .from("student_labs")
        .select(
          `
          lab_id,
          labs!student_labs_lab_id_fkey (
            id, name, section, day_of_week, start_time, end_time,
            subjects:subject_id (name, code)
          )
        `
        )
        .eq("student_id", selectedStudent.id);

      setStudentLabs(enrollments || []);
      setIsLabAssignModalVisible(false);
    } catch (error) {
      console.error("Error assigning lab:", error);
      Alert.alert("Error", "Failed to enroll student in lab");
    } finally {
      setIsLoadingData(false);
    }
  };

  const removeLabEnrollment = async (labId: string) => {
    if (!selectedStudent) return;

    try {
      Alert.alert(
        "Remove Enrollment",
        "Are you sure you want to remove this student from the lab?",
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
                .match({ student_id: selectedStudent.id, lab_id: labId });

              if (error) throw error;

              // Refresh student labs
              const { data: enrollments } = await supabase
                .from("student_labs")
                .select(
                  `
                  lab_id,
                  labs!student_labs_lab_id_fkey (
                    id, name, section, day_of_week, start_time, end_time,
                    subjects:subject_id (name, code)
                  )
                `
                )
                .eq("student_id", selectedStudent.id);

              setStudentLabs(enrollments || []);
              setIsLoadingData(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error removing enrollment:", error);
      Alert.alert("Error", "Failed to remove enrollment");
      setIsLoadingData(false);
    }
  };

  const formatLabName = (lab: any) => {
    if (!lab) return "Unknown Lab";

    const subject = lab.subjects;
    let subjectName = "Unknown Course";

    if (subject) {
      if (typeof subject === "object" && !Array.isArray(subject)) {
        if (subject.name) {
          subjectName = subject.name;
        }
      } else if (Array.isArray(subject) && subject.length > 0) {
        if (subject[0]?.name) {
          subjectName = subject[0].name;
        }
      }
    }

    return `${lab.name} (${subjectName})`;
  };

  if (isLoading || isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Management</Text>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.light.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, or email"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.light.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.filterDropdown}>
            <DropDownPicker
              open={openCoursePicker}
              value={filterCourse}
              items={courseOptions}
              setOpen={setOpenCoursePicker}
              setValue={setFilterCourse}
              placeholder="Filter by Course"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              listMode="SCROLLVIEW"
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>

          <View style={styles.filterDropdown}>
            <DropDownPicker
              open={openSectionPicker}
              value={filterSection}
              items={sectionOptions}
              setOpen={setOpenSectionPicker}
              setValue={setFilterSection}
              placeholder="Filter by Section"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              listMode="SCROLLVIEW"
              zIndex={2000}
              zIndexInverse={2000}
            />
          </View>

          {filterCourse || filterSection ? (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setFilterCourse(null);
                setFilterSection(null);
              }}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        renderItem={({ item }) => (
          <View style={styles.studentCard}>
            <View style={styles.studentInfo}>
              <View style={styles.studentAvatar}>
                <Text style={styles.avatarText}>
                  {item.full_name?.substring(0, 2).toUpperCase() || "ST"}
                </Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{item.full_name}</Text>
                <Text style={styles.studentId}>{item.student_id}</Text>
                <Text style={styles.studentSubdetails}>
                  {item.course || "No course"} • {item.section || "No section"}
                </Text>
              </View>
            </View>
            <View style={styles.studentActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLabAssignment(item)}
              >
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={Colors.light.primary}
                />
                <Text style={styles.actionButtonText}>Assign Lab</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleViewStudent(item)}
              >
                <Ionicons name="eye" size={20} color={Colors.light.primary} />
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people"
              size={48}
              color={Colors.light.textTertiary}
            />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        }
      />

      {/* Lab Assignment Modal */}
      <Modal
        visible={isLabAssignModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLabAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "70%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Lab</Text>
              <TouchableOpacity
                onPress={() => setIsLabAssignModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            {selectedStudent && (
              <Text style={styles.modalText}>
                Assign a lab to {selectedStudent.full_name}
              </Text>
            )}

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Select Lab</Text>
              <DropDownPicker
                open={openLabPicker}
                value={selectedLabId}
                items={labs.map((lab) => ({
                  label: formatLabName(lab),
                  value: lab.id,
                }))}
                setOpen={setOpenLabPicker}
                setValue={setSelectedLabId}
                placeholder="Select a lab"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                listMode="SCROLLVIEW"
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                maxHeight={300}
                zIndex={3000}
                zIndexInverse={1000}
                searchable={true}
                searchPlaceholder="Search labs..."
                searchContainerStyle={styles.searchContainer}
                searchTextInputStyle={styles.searchInput}
                itemSeparator={true}
                itemSeparatorStyle={styles.itemSeparator}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsLabAssignModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={assignLabToStudent}
              >
                <Text style={styles.confirmButtonText}>Assign</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Student Details Modal */}
      <Modal
        visible={isStudentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsStudentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.studentModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Student Details</Text>
              <TouchableOpacity onPress={() => setIsStudentModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            {selectedStudent && (
              <ScrollView>
                <View style={styles.studentDetailSection}>
                  <View style={styles.centerAvatar}>
                    <View style={styles.largeStudentAvatar}>
                      <Text style={styles.largeAvatarText}>
                        {selectedStudent.full_name
                          ?.substring(0, 2)
                          .toUpperCase() || "ST"}
                      </Text>
                    </View>
                    <Text style={styles.detailStudentName}>
                      {selectedStudent.full_name}
                    </Text>
                    <Text style={styles.detailStudentId}>
                      {selectedStudent.student_id}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      Basic Information
                    </Text>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Email</Text>
                      <Text style={styles.detailValue}>
                        {selectedStudent.email}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Course</Text>
                      <Text style={styles.detailValue}>
                        {selectedStudent.course || "Not specified"}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Section</Text>
                      <Text style={styles.detailValue}>
                        {selectedStudent.section || "Not specified"}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Joined</Text>
                      <Text style={styles.detailValue}>
                        {new Date(
                          selectedStudent.created_at
                        ).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.detailSectionTitle}>
                        Enrolled Labs
                      </Text>
                      <TouchableOpacity
                        style={styles.addLabButton}
                        onPress={() => {
                          setIsStudentModalVisible(false);
                          setTimeout(
                            () => handleLabAssignment(selectedStudent),
                            300
                          );
                        }}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.addLabButtonText}>Add Lab</Text>
                      </TouchableOpacity>
                    </View>

                    {studentLabs.length === 0 ? (
                      <View style={styles.emptyLabsContainer}>
                        <Ionicons
                          name="calendar-outline"
                          size={40}
                          color={Colors.light.textSecondary}
                        />
                        <Text style={styles.noLabsText}>
                          Student is not enrolled in any labs
                        </Text>
                      </View>
                    ) : (
                      <ScrollView
                        style={styles.labsScrollContainer}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                      >
                        {studentLabs.map((enrollment) => (
                          <View key={enrollment.lab_id} style={styles.labCard}>
                            <View style={styles.labInfo}>
                              <Text style={styles.labName}>
                                {enrollment.labs?.name || "Unknown Lab"}
                              </Text>
                              <Text style={styles.labDetails}>
                                {enrollment.labs?.day_of_week || "Unknown day"}{" "}
                                • {enrollment.labs?.start_time || "--:--"} -{" "}
                                {enrollment.labs?.end_time || "--:--"}
                              </Text>
                              <Text style={styles.labSection}>
                                {enrollment.labs?.section || "No section"} •{" "}
                                {enrollment.labs?.subjects?.name ||
                                  "Unknown course"}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.removeLabButton}
                              onPress={() =>
                                removeLabEnrollment(enrollment.lab_id)
                              }
                            >
                              <Ionicons
                                name="trash-outline"
                                size={20}
                                color={Colors.light.error}
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </View>
              </ScrollView>
            )}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    color: Colors.light.text,
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  filterDropdown: {
    flex: 1,
    minWidth: 150,
    marginRight: 8,
    marginBottom: 8,
    zIndex: 1000,
  },
  dropdown: {
    borderColor: Colors.light.borderLight,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
  },
  dropdownContainer: {
    borderColor: Colors.light.borderLight,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  clearFiltersButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: Colors.light.borderLight,
    marginBottom: 8,
  },
  clearFiltersText: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 16,
  },
  studentCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  studentInfo: {
    flexDirection: "row",
    marginBottom: 12,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: Colors.light.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.light.text,
  },
  studentId: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  studentSubdetails: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  studentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 5,
    marginLeft: 12,
  },
  actionButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxHeight: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  studentModalContent: {
    width: "95%",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modalText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },
  modalFormGroup: {
    marginBottom: 24,
    zIndex: 1000,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.light.borderLight,
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  studentDetailSection: {
    paddingBottom: 24,
  },
  centerAvatar: {
    alignItems: "center",
    marginVertical: 16,
  },
  largeStudentAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  largeAvatarText: {
    color: Colors.light.primary,
    fontSize: 28,
    fontWeight: "bold",
  },
  detailStudentName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  detailStudentId: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  detailSection: {
    marginTop: 16,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    padding: 16,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  detailLabel: {
    width: 80,
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addLabButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addLabButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyLabsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noLabsText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
  labsScrollContainer: {
    maxHeight: 300,
  },
  labCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  labInfo: {
    flex: 1,
  },
  labName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  labDetails: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  labSection: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  removeLabButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundAlt,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
  },
});
