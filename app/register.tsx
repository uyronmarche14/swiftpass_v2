import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Colors } from "../constants/Colors";
import { CustomInput } from "../components/ui/CustomInput";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

interface FormData {
  fullName: string;
  email: string;
  studentId: string;
  password: string;
  confirmPassword: string;
  course: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  studentId?: string;
  password?: string;
  confirmPassword?: string;
  course?: string;
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
  });
  const [errors, setErrors] = useState<FormErrors>({});

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
        });

        const success = await register(
          formData.email,
          formData.password,
          formData.fullName,
          formData.studentId,
          formData.course
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Register to access your attendance QR code
        </Text>

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

          <CustomInput
            label="Course (Optional)"
            value={formData.course}
            onChangeText={(text) => setFormData({ ...formData, course: text })}
            placeholder="e.g. Computer Science"
            error={errors.course}
          />

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
    marginBottom: 5,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 12,
    marginTop: 5,
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
});
