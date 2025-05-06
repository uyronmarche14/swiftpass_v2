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
import { router } from "expo-router";

// Hardcoded section options
const sectionOptions = [
  { label: "Section A2021", value: "A2021" },
  { label: "Section B2021", value: "B2021" },
  { label: "Section C2021", value: "C2021" },
];

export default function LabsScreen() {
  const { isAdmin, isLoading, getAllLabs } = useAuth();
  const [labs, setLabs] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  // Form state for creating a new lab
  const [labName, setLabName] = useState("");
  const [section, setSection] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Dropdown state
  const [openDayPicker, setOpenDayPicker] = useState(false);
  const [openSubjectPicker, setOpenSubjectPicker] = useState(false);
  const [openSectionPicker, setOpenSectionPicker] = useState(false);

  const days = [
    { label: "Monday", value: "Monday" },
    { label: "Tuesday", value: "Tuesday" },
    { label: "Wednesday", value: "Wednesday" },
    { label: "Thursday", value: "Thursday" },
    { label: "Friday", value: "Friday" },
    { label: "Saturday", value: "Saturday" },
    { label: "Sunday", value: "Sunday" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const labsData = await getAllLabs();
      setLabs(labsData);

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .order("name", { ascending: true });

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);
    } catch (error) {
      console.error("Error loading labs data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreateLab = async () => {
    if (!labName || !dayOfWeek || !startTime || !endTime || !selectedSubject) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert("Error", "Please enter valid times in HH:MM format");
      return;
    }

    try {
      setIsLoadingData(true);

      const newLab = {
        name: labName,
        section: section || null,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        subject_id: selectedSubject,
      };

      const { error } = await supabase.from("labs").insert([newLab]);

      if (error) throw error;

      Alert.alert("Success", "Lab created successfully");
      resetForm();
      setIsCreateModalVisible(false);
      await loadData();
    } catch (error) {
      console.error("Error creating lab:", error);
      Alert.alert("Error", "Failed to create lab");
    } finally {
      setIsLoadingData(false);
    }
  };

  const removeLab = async (labId: string) => {
    try {
      Alert.alert(
        "Remove Lab",
        "Are you sure you want to remove this lab? This will also remove all associated student enrollments.",
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

              // First delete all enrollments for this lab
              const { error: enrollmentError } = await supabase
                .from("student_labs")
                .delete()
                .match({ lab_id: labId });

              if (enrollmentError) throw enrollmentError;

              // Then delete the lab
              const { error } = await supabase
                .from("labs")
                .delete()
                .eq("id", labId);

              if (error) throw error;

              await loadData();
              setIsLoadingData(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error removing lab:", error);
      Alert.alert("Error", "Failed to remove lab");
      setIsLoadingData(false);
    }
  };

  const resetForm = () => {
    setLabName("");
    setSection("");
    setDayOfWeek("");
    setStartTime("");
    setEndTime("");
    setSelectedSubject(null);
  };

  const openQRScanner = (labId: string) => {
    router.push({
      pathname: "/admin/scanner",
      params: { labId },
    });
  };

  if (isLoading || isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading labs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Laboratory Sessions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setIsCreateModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Create Lab</Text>
        </TouchableOpacity>
      </View>

      {labs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="flask-outline"
            size={64}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.emptyText}>No labs created yet</Text>
          <Text style={styles.emptySubText}>
            Create labs to assign students to them
          </Text>
        </View>
      ) : (
        <FlatList
          data={labs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.labCard}>
              <View style={styles.labHeader}>
                <View style={styles.labIcon}>
                  <Ionicons name="flask" size={24} color="#fff" />
                </View>
                <View style={styles.labInfo}>
                  <Text style={styles.labName}>{item.name}</Text>
                  <Text style={styles.labSubject}>
                    {item.subjects?.name}{" "}
                    {item.subjects?.code && `(${item.subjects.code})`}
                  </Text>
                </View>
                <View style={styles.labActions}>
                  <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => openQRScanner(item.id)}
                  >
                    <Ionicons name="qr-code-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeLab(item.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={Colors.light.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.labDetails}>
                {item.section && (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="list"
                      size={18}
                      color={Colors.light.primary}
                    />
                    <Text style={styles.detailText}>
                      Section {item.section}
                    </Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Ionicons
                    name="calendar"
                    size={18}
                    color={Colors.light.primary}
                  />
                  <Text style={styles.detailText}>{item.day_of_week}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons
                    name="time"
                    size={18}
                    color={Colors.light.primary}
                  />
                  <Text style={styles.detailText}>
                    {item.start_time} - {item.end_time}
                  </Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.labsList}
        />
      )}

      {/* Create Lab Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Lab</Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Lab Name *</Text>
              <TextInput
                style={styles.input}
                value={labName}
                onChangeText={setLabName}
                placeholder="Enter lab name"
              />

              <Text style={styles.inputLabel}>Section (Optional)</Text>
              <DropDownPicker
                open={openSectionPicker}
                value={section}
                items={sectionOptions}
                setOpen={setOpenSectionPicker}
                setValue={setSection}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                placeholder="Select section"
                zIndex={4000}
                zIndexInverse={1000}
              />

              <Text
                style={[
                  styles.inputLabel,
                  { marginTop: openSectionPicker ? 180 : 16 },
                ]}
              >
                Day of Week *
              </Text>
              <DropDownPicker
                open={openDayPicker}
                value={dayOfWeek}
                items={days}
                setOpen={setOpenDayPicker}
                setValue={setDayOfWeek}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                placeholder="Select day"
                zIndex={3000}
                zIndexInverse={1000}
              />

              <View style={styles.timeContainer}>
                <View style={styles.timeInput}>
                  <Text style={styles.inputLabel}>Start Time *</Text>
                  <TextInput
                    style={styles.input}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="HH:MM"
                    keyboardType="numbers-and-punctuation"
                  />
                </View>

                <View style={styles.timeInput}>
                  <Text style={styles.inputLabel}>End Time *</Text>
                  <TextInput
                    style={styles.input}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="HH:MM"
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>

              <Text
                style={[
                  styles.inputLabel,
                  { marginTop: openDayPicker ? 180 : 16 },
                ]}
              >
                Subject *
              </Text>
              <DropDownPicker
                open={openSubjectPicker}
                value={selectedSubject}
                items={subjects.map((subject) => {
                  // Convert subject code to full course name
                  const courseFullName =
                    subject.code === "BSIT"
                      ? "Bachelor of Science in Information Technology"
                      : subject.code === "BSCS"
                      ? "Bachelor of Science in Computer Science"
                      : subject.name;

                  return {
                    label: `${courseFullName} (${subject.code || "No code"})`,
                    value: subject.id,
                  };
                })}
                setOpen={setOpenSubjectPicker}
                setValue={setSelectedSubject}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                placeholder="Select subject"
                zIndex={2000}
                zIndexInverse={2000}
              />

              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!labName ||
                    !dayOfWeek ||
                    !startTime ||
                    !endTime ||
                    !selectedSubject) &&
                    styles.disabledButton,
                ]}
                onPress={handleCreateLab}
                disabled={
                  !labName ||
                  !dayOfWeek ||
                  !startTime ||
                  !endTime ||
                  !selectedSubject
                }
              >
                <Text style={styles.createButtonText}>Create Lab</Text>
              </TouchableOpacity>
            </ScrollView>
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
  labsList: {
    padding: 16,
  },
  labCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  labHeader: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    alignItems: "center",
  },
  labIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  labInfo: {
    flex: 1,
    marginLeft: 12,
  },
  labName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  labSubject: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  labDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
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
  formContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dropdown: {
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 0,
    borderRadius: 8,
    marginBottom: 16,
  },
  dropdownContainer: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timeInput: {
    width: "48%",
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: Colors.light.primaryLight,
    opacity: 0.7,
  },
  labActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: Colors.light.success,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  editButton: {
    backgroundColor: Colors.light.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
