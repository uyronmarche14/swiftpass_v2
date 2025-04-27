import { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Colors } from "../constants/Colors";
import { CustomInput } from "../components/ui/CustomInput";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (validateForm()) {
      try {
        const success = await login(email, password);
        if (!success) {
          Alert.alert("Login Error", "Invalid email or password");
        }
      } catch (error) {
        Alert.alert("Error", "An unexpected error occurred during login");
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Sign in</Text>

      <View style={styles.formContainer}>
        <CustomInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <CustomInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          error={errors.password}
          secureTextEntry={!showPassword}
          rightIcon={
            <TouchableOpacity onPress={togglePasswordVisibility}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color={Colors.light.icon}
              />
            </TouchableOpacity>
          }
        />

        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signInText}>Sign in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerContainer}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.registerText}>
            Don't have an account?{" "}
            <Text style={styles.registerTextBold}>Register now</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    marginTop: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 40,
    marginBottom: 40,
    color: Colors.light.text,
  },
  formContainer: {
    width: "100%",
  },
  signInButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signInText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: "bold",
  },
  registerContainer: {
    marginTop: 20,
    alignItems: "center",
    padding: 12,
  },
  registerText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  registerTextBold: {
    color: Colors.light.tint,
    fontWeight: "600",
  },
});
