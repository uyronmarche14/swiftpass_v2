import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
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
import { CourseService, Course } from "../../lib/services/courseService";

export default function CoursesScreen() {
  const { isAdmin, isLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  // Form state
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoadingData(true);
    try {
      const result = await CourseService.getAllCourses();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setCourses(result.data as Course[] || []);
    } catch (error) {
      console.error("Error loading courses:", error);
      Alert.alert("Error", "Failed to load courses");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseCode || !courseName) {
      Alert.alert("Error", "Course code and name are required");
      return;
    }

    try {
      setIsLoadingData(true);

      const newCourse = {
        code: courseCode.toUpperCase(),
        name: courseName,
        description: courseDescription || undefined,
      };

      const result = await CourseService.createCourse(newCourse);

      if (!result.success) {
        throw new Error(result.error);
      }

      Alert.alert("Success", "Course created successfully");
      resetForm();
      setIsCreateModalVisible(false);
      await loadCourses();
    } catch (error) {
      console.error("Error creating course:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create course");
    } finally {
      setIsLoadingData(false);
    }
  };

  const removeCourse = async (courseId: string) => {
    Alert.alert(
      "Remove Course",
      "Are you sure you want to remove this course? This may affect students and labs associated with this course.",
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
            try {
              // Check for associated labs first
              const labsResult = await CourseService.getCourseLabsById(courseId);
              
              if (labsResult.success && Array.isArray(labsResult.data) && labsResult.data.length > 0) {
                Alert.alert(
                  "Cannot Remove Course", 
                  `This course has ${labsResult.data.length} lab(s) associated with it. Please remove the labs first.`,
                  [{ text: "OK" }]
                );
                setIsLoadingData(false);
                return;
              }
              
              // Delete the course
              const result = await CourseService.deleteCourse(courseId);
              
              if (!result.success) {
                throw new Error(result.error);
              }
              
              await loadCourses();
              Alert.alert("Success", "Course removed successfully");
            } catch (error) {
              console.error("Error removing course:", error);
              Alert.alert("Error", error instanceof Error ? error.message : "Failed to remove course");
            } finally {
              setIsLoadingData(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setCourseCode("");
    setCourseName("");
    setCourseDescription("");
  };

  if (isLoading || isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Courses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setIsCreateModalVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Course</Text>
        </TouchableOpacity>
      </View>

      {courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="book-outline"
            size={64}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.emptyText}>No courses added yet</Text>
          <Text style={styles.emptySubText}>
            Add courses to start managing student enrollments
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.courseIcon}>
                  <Ionicons name="book" size={20} color="#fff" />
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseCode}>{item.code}</Text>
                  <Text style={styles.courseName}>{item.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeCourse(item.id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#FF3B30"
                  />
                </TouchableOpacity>
              </View>
              {item.description && (
                <Text style={styles.courseDescription}>
                  {item.description}
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={isLoadingData ? null : (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyText}>No Courses Found</Text>
              <Text style={styles.emptySubText}>
                Create your first course by clicking the "Add Course" button above
              </Text>
            </View>
          )}
          contentContainerStyle={styles.coursesList}
          showsVerticalScrollIndicator={true}
        />
      )}

      {/* Create Course Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Course</Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Course Code *</Text>
              <TextInput
                style={styles.input}
                value={courseCode}
                onChangeText={setCourseCode}
                placeholder="e.g., CS101"
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Course Name *</Text>
              <TextInput
                style={styles.input}
                value={courseName}
                onChangeText={setCourseName}
                placeholder="e.g., Introduction to Computer Science"
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={courseDescription}
                onChangeText={setCourseDescription}
                placeholder="Enter course description"
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!courseCode || !courseName) && styles.disabledButton,
                ]}
                onPress={handleCreateCourse}
                disabled={!courseCode || !courseName}
              >
                <Text style={styles.createButtonText}>Create Course</Text>
              </TouchableOpacity>
            </View>
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
  },
  title: {
    fontSize: 24,
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
  coursesList: {
    padding: 16,
  },
  courseCard: {
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
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  courseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  courseName: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  courseDescription: {
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 8,
    marginLeft: 52,
  },
  deleteButton: {
    padding: 8,
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 32,
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
});
