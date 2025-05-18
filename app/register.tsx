import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { Colors } from "../constants/Colors";
import { CustomInput } from "../components/ui/CustomInput";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { CourseService, Course } from "../lib/services/courseService";
import { SectionService, Section } from "../lib/services/sectionService";

interface FormData {
  fullName: string;
  email: string;
  studentId: string;
  password: string;
  confirmPassword: string;
  course: string;
  section: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  studentId?: string;
  password?: string;
  confirmPassword?: string;
  course?: string;
  section?: string;
}
// Definition of dropdown option type
interface DropdownOption {
  label: string;
  value: string;
}

export default function Register() {
  const { register, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    studentId: "",
    password: "",
    confirmPassword: "",
    course: "",
    section: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // State for dropdowns
  const [openCourseDropdown, setOpenCourseDropdown] = useState(false);
  const [openSectionDropdown, setOpenSectionDropdown] = useState(false);
  
  // State for dynamic dropdown options
  const [courseOptions, setCourseOptions] = useState<DropdownOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<DropdownOption[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  
  // Load courses and sections when component mounts
  useEffect(() => {
    fetchCourses();
    fetchSections();
  }, []);
  
  // Fetch courses from backend
  const fetchCourses = async () => {
    try {
      setIsLoadingCourses(true);
      const response = await CourseService.getAllCourses();
      
      if (response.success && response.data) {
        // Convert courses to dropdown options format
        const courses = Array.isArray(response.data) ? response.data : [response.data];
        const options = courses.map(course => ({
          label: `${course.name} (${course.code})`,
          value: course.code
        }));
        
        setCourseOptions(options);
      } else {
        console.error("Failed to load courses:", response.error);
        setLoadingError("Failed to load courses. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setLoadingError("Failed to load courses. Please check your connection.");
    } finally {
      setIsLoadingCourses(false);
    }
  };
  
  // Fetch sections from backend
  const fetchSections = async () => {
    try {
      setIsLoadingSections(true);
      const response = await SectionService.getAllSections();
      
      if (response.success && response.data) {
        // Convert sections to dropdown options format
        const sections = Array.isArray(response.data) ? response.data : [response.data];
        const options = sections.map(section => ({
          label: `${section.name} (${section.code})`,
          value: section.code
        }));
        
        setSectionOptions(options);
      } else {
        console.error("Failed to load sections:", response.error);
        setLoadingError("Failed to load sections. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      setLoadingError("Failed to load sections. Please check your connection.");
    } finally {
      setIsLoadingSections(false);
    }
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = "Student ID is required";
    } else if (formData.studentId.length < 5) {
      newErrors.studentId = "Student ID must be at least 5 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleRegister = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        console.log("Attempting to register with:", {
          email: formData.email,
          fullName: formData.fullName,
          studentId: formData.studentId,
          course: formData.course,
          section: formData.section,
        });

        const success = await register(
          formData.email,
          formData.password,
          formData.fullName,
          formData.studentId,
          formData.course,
          formData.section
        );

        if (success) {
          // Show success message before navigating
          Alert.alert(
            "Registration Successful",
            "Your account has been created and you are now logged in.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Registration Error",
            "Failed to create account. Please check the console for more details."
          );
        }
      } catch (error) {
        console.error("Error during registration:", error);
        Alert.alert(
          "Error",
          "An unexpected error occurred during registration"
        );
      }
    }
  };

  const handleSignInPress = () => {
    router.push("/login");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={28} color={Colors.light.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to manage your profile</Text>
          
          {loadingError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorMessage}>{loadingError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setLoadingError("");
                  fetchCourses();
                  fetchSections();
                }}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.formContainer}>
          <CustomInput
            label="Full Name"
            value={formData.fullName}
            onChangeText={(text) =>
              setFormData({ ...formData, fullName: text })
            }
            placeholder="Enter your full name"
            error={errors.fullName}
          />

          <CustomInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="email@example.com"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomInput
            label="Student ID"
            value={formData.studentId}
            onChangeText={(text) =>
              setFormData({ ...formData, studentId: text })
            }
            placeholder="Enter your student ID"
            error={errors.studentId}
            autoCapitalize="characters"
            maxLength={10}
          />

          <Text style={styles.label}>Course</Text>
          {isLoadingCourses ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Loading courses...</Text>
            </View>
          ) : (
            <DropDownPicker
              open={openCourseDropdown}
              value={formData.course}
              items={courseOptions}
              setOpen={setOpenCourseDropdown}
              setValue={(callback) => {
                const value = callback(formData.course);
                setFormData({ ...formData, course: value });
              }}
              placeholder="Select your course"
              style={[styles.dropdown, errors.course ? styles.inputError : null]}
              dropDownContainerStyle={styles.dropdownContainer}
              zIndex={3000}
              zIndexInverse={1000}
              listMode="SCROLLVIEW"
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
              maxHeight={200}
            />
          )}
          {errors.course ? (
            <Text style={styles.errorText}>{errors.course}</Text>
          ) : null}

          <Text
            style={[styles.label, { marginTop: openCourseDropdown ? 180 : 15 }]}
          >
            Section
          </Text>
          {isLoadingSections ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Loading sections...</Text>
            </View>
          ) : (
            <DropDownPicker
              open={openSectionDropdown}
              value={formData.section}
              items={sectionOptions}
              setOpen={setOpenSectionDropdown}
              setValue={(callback) => {
                const value = callback(formData.section);
                setFormData({ ...formData, section: value });
              }}
              placeholder="Select your section"
              style={[
                styles.dropdown,
                errors.section ? styles.inputError : null,
              ]}
              dropDownContainerStyle={styles.dropdownContainer}
              zIndex={2000}
              zIndexInverse={2000}
              listMode="SCROLLVIEW"
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
              maxHeight={200}
            />
          )}
          {errors.section ? (
            <Text style={styles.errorText}>{errors.section}</Text>
          ) : null}

          <CustomInput
            label="Password"
            value={formData.password}
            onChangeText={(text) =>
              setFormData({ ...formData, password: text })
            }
            placeholder="Create a password"
            error={errors.password}
            secureTextEntry={!showPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color={Colors.light.icon}
                />
              </TouchableOpacity>
            }
            containerStyle={{ marginTop: openSectionDropdown ? 180 : 15 }}
          />

          <CustomInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) =>
              setFormData({ ...formData, confirmPassword: text })
            }
            placeholder="Confirm your password"
            error={errors.confirmPassword}
            secureTextEntry={!showConfirmPassword}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={24}
                  color={Colors.light.icon}
                />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleSignInPress}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 24,
  },
  formContainer: {
    width: "100%",
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  label: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 8,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 12,
    marginTop: 5,
  },
  dropdown: {
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 0,
    borderRadius: 8,
    marginBottom: 5,
    height: 50,
  },
  dropdownContainer: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
  },
  registerButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  signInText: {
    color: Colors.light.text,
  },
  signInLink: {
    color: Colors.light.primary,
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: Colors.light.text,
  },
  errorContainer: {
    backgroundColor: "#ffeeee",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  errorMessage: {
    color: Colors.light.error,
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  retryText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
